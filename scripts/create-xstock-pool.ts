import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import idl from "../target/idl/amm_v3.json";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDC_DECIMALS = 6;
const AMM_CONFIG_INDEX = 1;

const i32ToBe = (num: number) => {
  const buf = Buffer.alloc(4);
  buf.writeInt32BE(num, 0);
  return buf;
};

// ========== xStock Token Definitions ==========
const XSTOCKS: Record<string, { mint: string; symbol: string; price: number }> = {
  CRCLx:  { mint: "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1", symbol: "CRCLx",  price: 0 },
  MSTRx:  { mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ", symbol: "MSTRx",  price: 0 },
  NVDAx:  { mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", symbol: "NVDAx",  price: 0 },
  AMZNx:  { mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", symbol: "AMZNx",  price: 0 },
  AAPLx:  { mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", symbol: "AAPLx",  price: 0 },
  GOOGLx: { mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", symbol: "GOOGLx", price: 0 },
  QQQx:   { mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ", symbol: "QQQx",   price: 0 },
  METAx:  { mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", symbol: "METAx",  price: 0 },
  SPYx:   { mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", symbol: "SPYx",   price: 0 },
};

// Usage: pnpm tsx scripts/create-xstock-pool.ts <SYMBOL> <PRICE>
// Example: pnpm tsx scripts/create-xstock-pool.ts CRCLx 115
const symbol = process.argv[2];
const priceArg = parseFloat(process.argv[3]);

if (!symbol || !priceArg || isNaN(priceArg)) {
  console.log("Usage: pnpm tsx scripts/create-xstock-pool.ts <SYMBOL> <PRICE>");
  console.log("Example: pnpm tsx scripts/create-xstock-pool.ts CRCLx 115");
  console.log("\nAvailable tokens:", Object.keys(XSTOCKS).join(", "));
  process.exit(1);
}

const tokenDef = XSTOCKS[symbol];
if (!tokenDef) {
  console.error(`Unknown token: ${symbol}. Available: ${Object.keys(XSTOCKS).join(", ")}`);
  process.exit(1);
}
tokenDef.price = priceArg;

const XSTOCK_MINT = new PublicKey(tokenDef.mint);
const XSTOCK_DECIMALS = 8; // all xStocks are 8 decimals
const XSTOCK_PRICE = tokenDef.price;

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new Program(idl as any, provider);
  const wallet = provider.wallet as anchor.Wallet;
  const conn = provider.connection;

  const getBalance = async () => (await conn.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL;

  console.log(`=== ${symbol}/USDC 主网池子创建与测试 ===\n`);
  console.log("Program:", program.programId.toBase58());
  console.log("Wallet:", wallet.publicKey.toBase58());

  const startBalance = await getBalance();
  console.log(`初始余额: ${startBalance.toFixed(6)} SOL\n`);

  // Sort tokens: mint0 < mint1
  let tokenMint0: PublicKey, tokenMint1: PublicKey;
  let tokenProgram0: PublicKey, tokenProgram1: PublicKey;
  let decimals0: number, decimals1: number;
  let label0: string, label1: string;

  if (XSTOCK_MINT.toBuffer().compare(USDC_MINT.toBuffer()) < 0) {
    tokenMint0 = XSTOCK_MINT; tokenMint1 = USDC_MINT;
    tokenProgram0 = TOKEN_2022_PROGRAM_ID; tokenProgram1 = TOKEN_PROGRAM_ID;
    decimals0 = XSTOCK_DECIMALS; decimals1 = USDC_DECIMALS;
    label0 = symbol; label1 = "USDC";
  } else {
    tokenMint0 = USDC_MINT; tokenMint1 = XSTOCK_MINT;
    tokenProgram0 = TOKEN_PROGRAM_ID; tokenProgram1 = TOKEN_2022_PROGRAM_ID;
    decimals0 = USDC_DECIMALS; decimals1 = XSTOCK_DECIMALS;
    label0 = "USDC"; label1 = symbol;
  }

  console.log(`Token 0 (${label0}): ${tokenMint0.toBase58()} (${decimals0} dec, ${tokenProgram0.equals(TOKEN_2022_PROGRAM_ID) ? "Token-2022" : "SPL"})`);
  console.log(`Token 1 (${label1}): ${tokenMint1.toBase58()} (${decimals1} dec, ${tokenProgram1.equals(TOKEN_2022_PROGRAM_ID) ? "Token-2022" : "SPL"})`);
  console.log(`Price: 1 ${symbol} = ${XSTOCK_PRICE} USDC`);

  // ========== AmmConfig (reuse index=1) ==========
  const [ammConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("amm_config"), new BN(AMM_CONFIG_INDEX).toArrayLike(Buffer, "be", 2)],
    program.programId,
  );
  console.log(`\nAmmConfig (index=${AMM_CONFIG_INDEX}): ${ammConfig.toBase58()}`);

  // ========== Whitelist xStock mint ==========
  console.log(`\n--- 步骤 1: 白名单 ${symbol} mint ---`);
  let balBefore = await getBalance();

  const [supportMintAssociated] = PublicKey.findProgramAddressSync(
    [Buffer.from("support_mint"), XSTOCK_MINT.toBuffer()],
    program.programId,
  );

  let supportMintExists = false;
  try {
    const info = await conn.getAccountInfo(supportMintAssociated);
    if (info) {
      supportMintExists = true;
      console.log(`${symbol} 已白名单: ${supportMintAssociated.toBase58()}`);
    }
  } catch {}

  if (!supportMintExists) {
    const tx = await program.methods
      .createSupportMintAssociated()
      .accounts({
        owner: wallet.publicKey,
        tokenMint: XSTOCK_MINT,
        supportMintAssociated,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log(`白名单完成: ${tx}`);
    console.log(`消耗: ${(balBefore - await getBalance()).toFixed(6)} SOL`);
  }

  // ========== Get user token accounts ==========
  console.log(`\n--- 步骤 2: 检查代币余额 ---`);

  const userTokenAccount0 = await getOrCreateAssociatedTokenAccount(
    conn, wallet.payer, tokenMint0, wallet.publicKey, false, undefined, undefined, tokenProgram0
  );
  const userTokenAccount1 = await getOrCreateAssociatedTokenAccount(
    conn, wallet.payer, tokenMint1, wallet.publicKey, false, undefined, undefined, tokenProgram1
  );

  const bal0 = Number(userTokenAccount0.amount) / 10 ** decimals0;
  const bal1 = Number(userTokenAccount1.amount) / 10 ** decimals1;
  console.log(`${label0}: ${bal0}`);
  console.log(`${label1}: ${bal1}`);

  // ========== Create Pool ==========
  console.log(`\n--- 步骤 3: 创建 ${symbol}/USDC 池子 ---`);
  balBefore = await getBalance();

  const [poolState] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), ammConfig.toBuffer(), tokenMint0.toBuffer(), tokenMint1.toBuffer()],
    program.programId,
  );
  const [tokenVault0] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), poolState.toBuffer(), tokenMint0.toBuffer()],
    program.programId,
  );
  const [tokenVault1] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), poolState.toBuffer(), tokenMint1.toBuffer()],
    program.programId,
  );
  const [observationState] = PublicKey.findProgramAddressSync(
    [Buffer.from("observation"), poolState.toBuffer()],
    program.programId,
  );
  const [tickArrayBitmap] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_tick_array_bitmap_extension"), poolState.toBuffer()],
    program.programId,
  );

  let poolExists = false;
  try {
    const info = await conn.getAccountInfo(poolState);
    if (info) {
      poolExists = true;
      console.log("池子已存在:", poolState.toBase58());
    }
  } catch {}

  if (!poolExists) {
    // CLMM rawPrice = token1_smallest / token0_smallest
    // rawPrice = humanPrice * 10^decimals1 / 10^decimals0
    let price: number;
    if (label0 === "USDC") {
      // token0=USDC, token1=xStock → rawPrice = (1/humanPrice) * 10^dec1 / 10^dec0
      price = (1 / XSTOCK_PRICE) * Math.pow(10, decimals1) / Math.pow(10, decimals0);
    } else {
      // token0=xStock, token1=USDC → rawPrice = humanPrice * 10^dec1 / 10^dec0
      price = XSTOCK_PRICE * Math.pow(10, decimals1) / Math.pow(10, decimals0);
    }

    const sqrtPrice = Math.sqrt(price);
    const TWO_POW_64 = 2n ** 64n;
    const sqrtPriceX64 = BigInt(Math.floor(sqrtPrice * Number(TWO_POW_64)));

    console.log(`rawPrice: ${price}`);
    console.log(`sqrtPriceX64: ${sqrtPriceX64.toString()}`);

    // Verify price is reasonable
    const verifyPrice = Number(sqrtPriceX64) / Number(TWO_POW_64);
    const verifyHumanPrice = label0 === "USDC"
      ? (1 / (verifyPrice * verifyPrice)) * Math.pow(10, decimals0) / Math.pow(10, decimals1)
      : (verifyPrice * verifyPrice) * Math.pow(10, decimals0) / Math.pow(10, decimals1);
    console.log(`验证: 1 ${symbol} = ${verifyHumanPrice.toFixed(2)} USDC (期望: ${XSTOCK_PRICE})`);

    const tx = await program.methods
      .createPool(new BN(sqrtPriceX64.toString()), new BN(0))
      .accounts({
        poolCreator: wallet.publicKey,
        ammConfig,
        poolState,
        tokenMint0,
        tokenMint1,
        tokenVault0,
        tokenVault1,
        observationState,
        tickArrayBitmap,
        tokenProgram0,
        tokenProgram1,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .remainingAccounts([
        { pubkey: supportMintAssociated, isSigner: false, isWritable: false },
      ])
      .rpc();

    const cost = balBefore - (await getBalance());
    console.log(`✅ 池子创建成功!`);
    console.log(`Pool: ${poolState.toBase58()}`);
    console.log(`消耗: ${cost.toFixed(6)} SOL | TX: ${tx}`);
  }

  console.log(`\nPool State: ${poolState.toBase58()}`);
  console.log(`Token Vault 0: ${tokenVault0.toBase58()}`);
  console.log(`Token Vault 1: ${tokenVault1.toBase58()}`);

  // ========== Open position and add liquidity ==========
  // Check if pool already has liquidity (with retry for newly created pools)
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  let poolDataCheck: any;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      poolDataCheck = await (program.account as any).poolState.fetch(poolState);
      break;
    } catch {
      if (attempt < 4) { console.log("等待池子数据确认..."); await sleep(3000); }
      else throw new Error("Pool data not available after retries");
    }
  }
  const existingLiquidity = poolDataCheck.liquidity.toString();

  const tickSpacing = 60;
  const TICK_ARRAY_SIZE = 60;

  // Calculate raw price for tick
  const rawPriceForTick = label0 === "USDC"
    ? (1 / XSTOCK_PRICE) * Math.pow(10, decimals1) / Math.pow(10, decimals0)
    : XSTOCK_PRICE * Math.pow(10, decimals1) / Math.pow(10, decimals0);
  const currentTick = Math.round(Math.log(rawPriceForTick) / Math.log(1.0001));

  // ±10% price range, aligned to tickSpacing
  const tickLower = Math.floor((currentTick - 1000) / tickSpacing) * tickSpacing;
  const tickUpper = Math.ceil((currentTick + 1000) / tickSpacing) * tickSpacing;

  const tickArrayLowerStart = Math.floor(tickLower / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);
  const tickArrayUpperStart = Math.floor(tickUpper / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);

  const [tickArrayLower] = PublicKey.findProgramAddressSync(
    [Buffer.from("tick_array"), poolState.toBuffer(), i32ToBe(tickArrayLowerStart)],
    program.programId,
  );
  const [tickArrayUpper] = PublicKey.findProgramAddressSync(
    [Buffer.from("tick_array"), poolState.toBuffer(), i32ToBe(tickArrayUpperStart)],
    program.programId,
  );

  if (existingLiquidity !== "0") {
    console.log(`\n--- 步骤 4: 跳过开仓（池子已有流动性: ${existingLiquidity}） ---`);
  } else {
    console.log(`\n--- 步骤 4: 开仓并添加流动性 (~3U each side) ---`);
    balBefore = await getBalance();

    console.log(`Current tick: ${currentTick}, range: [${tickLower}, ${tickUpper}]`);

    const positionNftMint = Keypair.generate();
    const [personalPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), positionNftMint.publicKey.toBuffer()],
      program.programId,
    );
    const positionNftAccount = getAssociatedTokenAddressSync(
      positionNftMint.publicKey, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID,
    );

    // ~3U of each side.
    // With base_flag=false + liquidity=0, program uses amount1Max to calculate liquidity.
    // So amount1Max = desired USDC amount, amount0Max = generous slippage limit.
    const xstockAmount = 3.0 / XSTOCK_PRICE;
    const usdcAmount = 3.0;

    let amount0Max: BN, amount1Max: BN;
    if (label0 === symbol) {
      // token0=xStock, token1=USDC. base_flag=false → calc from amount1(USDC)
      amount0Max = new BN(Math.ceil(xstockAmount * 10.0 * 10 ** decimals0).toString()); // generous limit
      amount1Max = new BN(Math.ceil(usdcAmount * 10 ** decimals1).toString()); // actual 3 USDC
    } else {
      // token0=USDC, token1=xStock. base_flag=false → calc from amount1(xStock)
      // Need to flip: base_flag=false uses amount1, which is xStock here
      amount0Max = new BN(Math.ceil(usdcAmount * 10.0 * 10 ** decimals0).toString()); // generous limit
      amount1Max = new BN(Math.ceil(xstockAmount * 10 ** decimals1).toString()); // actual xStock amount
    }

    console.log(`目标: ~${xstockAmount.toFixed(6)} ${symbol} (~$3) + ~${usdcAmount} USDC (~$3)`);

    const openPosBuilder = program.methods
      .openPositionWithToken22Nft(
        tickLower, tickUpper, tickArrayLowerStart, tickArrayUpperStart,
        new BN(0), amount0Max, amount1Max, true, false,
      )
      .accounts({
        payer: wallet.publicKey,
        positionNftOwner: wallet.publicKey,
        positionNftMint: positionNftMint.publicKey,
        positionNftAccount,
        poolState,
        protocolPosition: wallet.publicKey,
        tickArrayLower,
        tickArrayUpper,
        personalPosition,
        tokenAccount0: userTokenAccount0.address,
        tokenAccount1: userTokenAccount1.address,
        tokenVault0, tokenVault1,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenProgram2022: TOKEN_2022_PROGRAM_ID,
        vault0Mint: tokenMint0, vault1Mint: tokenMint1,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: tickArrayBitmap, isSigner: false, isWritable: true },
      ])
      .signers([positionNftMint]);

    const simTx = await openPosBuilder.transaction();
    simTx.feePayer = wallet.publicKey;
    simTx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    const simResult = await conn.simulateTransaction(simTx, [wallet.payer, positionNftMint]);
    if (simResult.value.err) {
      console.log("模拟失败:", JSON.stringify(simResult.value.err));
      if (simResult.value.logs) simResult.value.logs.slice(-10).forEach((l: string) => console.log("  ", l));
      console.log("❌ 开仓失败，跳过...");
    } else {
      const tx = await openPosBuilder.rpc();
      const cost = balBefore - (await getBalance());
      console.log(`✅ 开仓成功!`);
      console.log(`Position NFT: ${positionNftMint.publicKey.toBase58()}`);
      console.log(`消耗: ${cost.toFixed(6)} SOL | TX: ${tx}`);

      const v0 = await getAccount(conn, tokenVault0, undefined, tokenProgram0);
      const v1 = await getAccount(conn, tokenVault1, undefined, tokenProgram1);
      console.log(`Vault ${label0}: ${Number(v0.amount) / 10 ** decimals0}`);
      console.log(`Vault ${label1}: ${Number(v1.amount) / 10 ** decimals1}`);
    }
  }

  // ========== Swap test ==========
  try {
    console.log(`\n--- 步骤 5: Swap 测试 (0.1 USDC → ${symbol}) ---`);
    balBefore = await getBalance();

    const user0Before = await getAccount(conn, userTokenAccount0.address, undefined, tokenProgram0);
    const user1Before = await getAccount(conn, userTokenAccount1.address, undefined, tokenProgram1);

    const swapAmount = new BN((0.1 * 10 ** USDC_DECIMALS).toString());

    const poolData = await (program.account as any).poolState.fetch(poolState);
    const poolTick = poolData.tickCurrent;

    const tickArrayStart0 = Math.floor(poolTick / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);
    const [swapTickArray0] = PublicKey.findProgramAddressSync(
      [Buffer.from("tick_array"), poolState.toBuffer(), i32ToBe(tickArrayStart0)],
      program.programId,
    );

    // Deduplicate tick arrays
    const tickArrayAccounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] = [
      { pubkey: tickArrayBitmap, isSigner: false, isWritable: true },
    ];
    const seen = new Set<string>();
    for (const ta of [swapTickArray0, tickArrayLower, tickArrayUpper]) {
      const key = ta.toBase58();
      if (!seen.has(key)) {
        seen.add(key);
        tickArrayAccounts.push({ pubkey: ta, isSigner: false, isWritable: true });
      }
    }

    let inputTokenAccount: PublicKey, outputTokenAccount: PublicKey;
    let inputVault: PublicKey, outputVault: PublicKey;
    let inputVaultMint: PublicKey, outputVaultMint: PublicKey;

    if (label0 === symbol) {
      inputTokenAccount = userTokenAccount1.address;
      outputTokenAccount = userTokenAccount0.address;
      inputVault = tokenVault1; outputVault = tokenVault0;
      inputVaultMint = tokenMint1; outputVaultMint = tokenMint0;
    } else {
      inputTokenAccount = userTokenAccount0.address;
      outputTokenAccount = userTokenAccount1.address;
      inputVault = tokenVault0; outputVault = tokenVault1;
      inputVaultMint = tokenMint0; outputVaultMint = tokenMint1;
    }

    const swapBuilder = program.methods
      .swapV2(swapAmount, new BN(1), new BN(0), true)
      .accounts({
        payer: wallet.publicKey,
        ammConfig, poolState,
        inputTokenAccount, outputTokenAccount,
        inputVault, outputVault,
        observationState,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenProgram2022: TOKEN_2022_PROGRAM_ID,
        memoProgram: MEMO_PROGRAM_ID,
        inputVaultMint, outputVaultMint,
      })
      .remainingAccounts(tickArrayAccounts);

    const swapSimTx = await swapBuilder.transaction();
    swapSimTx.feePayer = wallet.publicKey;
    swapSimTx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    const swapSim = await conn.simulateTransaction(swapSimTx, [wallet.payer]);
    if (swapSim.value.err) {
      console.log("Swap 模拟失败:", JSON.stringify(swapSim.value.err));
      if (swapSim.value.logs) swapSim.value.logs.slice(-10).forEach((l: string) => console.log("  ", l));
      throw new Error("Swap simulation failed");
    }

    const swapTx = await swapBuilder.rpc();

    const user0After = await getAccount(conn, userTokenAccount0.address, undefined, tokenProgram0);
    const user1After = await getAccount(conn, userTokenAccount1.address, undefined, tokenProgram1);

    const diff0 = Number(BigInt(user0After.amount) - BigInt(user0Before.amount)) / 10 ** decimals0;
    const diff1 = Number(BigInt(user1After.amount) - BigInt(user1Before.amount)) / 10 ** decimals1;

    const usdcIn = label0 === "USDC" ? -diff0 : -diff1;
    const xstockOut = label0 === symbol ? diff0 : diff1;
    const effectivePrice = usdcIn / xstockOut;

    console.log(`✅ Swap 成功!`);
    console.log(`输入: ${usdcIn.toFixed(6)} USDC`);
    console.log(`输出: ${xstockOut.toFixed(8)} ${symbol}`);
    console.log(`成交价: 1 ${symbol} = ${effectivePrice.toFixed(2)} USDC (期望: ~${XSTOCK_PRICE})`);
    console.log(`TX: ${swapTx}`);
  } catch (e: any) {
    console.log("❌ Swap 失败:", e.message || e);
    if (e.logs) e.logs.slice(-10).forEach((l: string) => console.log("  ", l));
  }

  // ========== Summary ==========
  const endBalance = await getBalance();
  console.log(`\n========================================`);
  console.log(`${symbol}/USDC 池子汇总`);
  console.log(`========================================`);
  console.log(`Pool:       ${poolState.toBase58()}`);
  console.log(`AmmConfig:  ${ammConfig.toBase58()}`);
  console.log(`Vault 0:    ${tokenVault0.toBase58()}`);
  console.log(`Vault 1:    ${tokenVault1.toBase58()}`);
  console.log(`Fee: 0.25% (全归 LP, protocol=0, fund=0)`);
  console.log(`SOL 消耗:   ${(startBalance - endBalance).toFixed(6)} SOL`);
  console.log(`========================================\n`);
})();
