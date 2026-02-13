import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs";

const POOL_ADDRESS = process.argv[2] || "83UYZwtd7Bs4iVxNtNBoT5D52YMB6rk2ShYGhEfMHkdP";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load IDL
  const idl = JSON.parse(readFileSync("target/idl/amm_v3.json", "utf-8"));
  
  // Create program interface
  const programId = new PublicKey("FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28");
  const program = new anchor.Program(idl, { connection });

  console.log("=".repeat(60));
  console.log("Raydium CLMM Pool Decoder");
  console.log("=".repeat(60));
  console.log(`\nPool Address: ${POOL_ADDRESS}`);
  console.log(`Network: Devnet`);
  console.log(`Program ID: ${programId.toString()}`);
  
  try {
    // Fetch and decode pool account
    const poolPubkey = new PublicKey(POOL_ADDRESS);
    const poolAccount = await (program.account as any).poolState.fetch(poolPubkey);
    
    console.log("\n" + "=".repeat(60));
    console.log("PoolState Account Data");
    console.log("=".repeat(60));
    
    console.log("\n--- Basic Info ---");
    console.log(`AMM Config: ${poolAccount.ammConfig.toString()}`);
    console.log(`Owner: ${poolAccount.owner.toString()}`);
    console.log(`Token Mint 0: ${poolAccount.tokenMint0.toString()}`);
    console.log(`Token Mint 1: ${poolAccount.tokenMint1.toString()}`);
    console.log(`Token Vault 0: ${poolAccount.tokenVault0.toString()}`);
    console.log(`Token Vault 1: ${poolAccount.tokenVault1.toString()}`);
    
    console.log("\n--- Token Decimals ---");
    console.log(`Mint 0 Decimals: ${poolAccount.mintDecimals0}`);
    console.log(`Mint 1 Decimals: ${poolAccount.mintDecimals1}`);
    
    console.log("\n--- Price & Liquidity ---");
    console.log(`Tick Spacing: ${poolAccount.tickSpacing}`);
    console.log(`Current Tick: ${poolAccount.tickCurrent}`);
    console.log(`Liquidity: ${poolAccount.liquidity.toString()}`);
    console.log(`Sqrt Price X64: ${poolAccount.sqrtPriceX64.toString()}`);
    
    // Calculate actual price from sqrt_price_x64
    const sqrtPrice = Number(poolAccount.sqrtPriceX64) / (2 ** 64);
    const price = sqrtPrice * sqrtPrice;
    console.log(`Calculated Price (token1/token0): ${price.toFixed(10)}`);
    
    console.log("\n--- Fee Growth ---");
    console.log(`Fee Growth Global 0 X64: ${poolAccount.feeGrowthGlobal0X64.toString()}`);
    console.log(`Fee Growth Global 1 X64: ${poolAccount.feeGrowthGlobal1X64.toString()}`);
    
    console.log("\n--- Protocol Fees ---");
    console.log(`Protocol Fees Token 0: ${poolAccount.protocolFeesToken0.toString()}`);
    console.log(`Protocol Fees Token 1: ${poolAccount.protocolFeesToken1.toString()}`);
    
    console.log("\n--- Swap Amounts ---");
    console.log(`Swap In Amount Token 0: ${poolAccount.swapInAmountToken0.toString()}`);
    console.log(`Swap Out Amount Token 1: ${poolAccount.swapOutAmountToken1.toString()}`);
    console.log(`Swap In Amount Token 1: ${poolAccount.swapInAmountToken1.toString()}`);
    console.log(`Swap Out Amount Token 0: ${poolAccount.swapOutAmountToken0.toString()}`);
    
    console.log("\n--- Total Fees ---");
    console.log(`Total Fees Token 0: ${poolAccount.totalFeesToken0.toString()}`);
    console.log(`Total Fees Claimed Token 0: ${poolAccount.totalFeesClaimedToken0.toString()}`);
    console.log(`Total Fees Token 1: ${poolAccount.totalFeesToken1.toString()}`);
    console.log(`Total Fees Claimed Token 1: ${poolAccount.totalFeesClaimedToken1.toString()}`);
    
    console.log("\n--- Fund Fees ---");
    console.log(`Fund Fees Token 0: ${poolAccount.fundFeesToken0.toString()}`);
    console.log(`Fund Fees Token 1: ${poolAccount.fundFeesToken1.toString()}`);
    
    console.log("\n--- Status ---");
    console.log(`Status: ${poolAccount.status}`);
    console.log(`Open Time: ${poolAccount.openTime.toString()}`);
    
    // Also fetch AmmConfig
    console.log("\n" + "=".repeat(60));
    console.log("AmmConfig Account Data");
    console.log("=".repeat(60));
    
    const ammConfigAccount = await (program.account as any).ammConfig.fetch(poolAccount.ammConfig);
    
    console.log(`\nIndex: ${ammConfigAccount.index}`);
    console.log(`Owner: ${ammConfigAccount.owner.toString()}`);
    console.log(`Trade Fee Rate: ${ammConfigAccount.tradeFeeRate} (${(ammConfigAccount.tradeFeeRate / 10000).toFixed(4)}%)`);
    console.log(`Protocol Fee Rate: ${ammConfigAccount.protocolFeeRate} (${(ammConfigAccount.protocolFeeRate / 10000).toFixed(4)}%)`);
    console.log(`Fund Fee Rate: ${ammConfigAccount.fundFeeRate} (${(ammConfigAccount.fundFeeRate / 10000).toFixed(4)}%)`);
    console.log(`Tick Spacing: ${ammConfigAccount.tickSpacing}`);
    console.log(`Fund Owner: ${ammConfigAccount.fundOwner.toString()}`);
    
    console.log("\n" + "=".repeat(60));
    console.log("Verification Links");
    console.log("=".repeat(60));
    console.log(`\nPool: https://solscan.io/account/${POOL_ADDRESS}?cluster=devnet`);
    console.log(`AmmConfig: https://solscan.io/account/${poolAccount.ammConfig.toString()}?cluster=devnet`);
    console.log(`Program: https://solscan.io/account/${programId.toString()}?cluster=devnet`);
    
  } catch (error) {
    console.error("Error fetching pool:", error);
  }
}

main().catch(console.error);
