import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import idl from "../target/idl/amm_v3.json";

// Memo program ID
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// Test swap functionality
(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(idl as any, provider);
  const wallet = provider.wallet as anchor.Wallet;

  console.log("=== Swap 功能测试 ===\n");

  // Step 1: Create two test tokens
  console.log("步骤 1: 创建测试代币...");
  
  const tokenAMint = await createMint(
    provider.connection,
    wallet.payer,
    wallet.publicKey,
    null,
    9,
    Keypair.generate(),
    undefined,
    TOKEN_PROGRAM_ID
  );

  const tokenBMint = await createMint(
    provider.connection,
    wallet.payer,
    wallet.publicKey,
    null,
    9,
    Keypair.generate(),
    undefined,
    TOKEN_PROGRAM_ID
  );

  // Sort tokens
  let tokenMint0: PublicKey, tokenMint1: PublicKey;
  if (tokenAMint.toBuffer().compare(tokenBMint.toBuffer()) < 0) {
    tokenMint0 = tokenAMint;
    tokenMint1 = tokenBMint;
  } else {
    tokenMint0 = tokenBMint;
    tokenMint1 = tokenAMint;
  }
  console.log("Token 0:", tokenMint0.toBase58());
  console.log("Token 1:", tokenMint1.toBase58());

  // Create user token accounts and mint tokens
  console.log("\n步骤 2: 创建用户代币账户并铸造代币...");
  
  const userTokenAccount0 = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    wallet.payer,
    tokenMint0,
    wallet.publicKey
  );
  const userTokenAccount1 = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    wallet.payer,
    tokenMint1,
    wallet.publicKey
  );

  // Mint 1000 tokens each
  const mintAmount = 1_000_000_000_000n; // 1000 tokens with 9 decimals
  await mintTo(
    provider.connection,
    wallet.payer,
    tokenMint0,
    userTokenAccount0.address,
    wallet.payer,
    mintAmount
  );
  await mintTo(
    provider.connection,
    wallet.payer,
    tokenMint1,
    userTokenAccount1.address,
    wallet.payer,
    mintAmount
  );
  console.log("已铸造 1000 Token 0 和 1000 Token 1");

  // Step 3: Use existing AmmConfig
  const ammConfigIndex = 0;
  const [ammConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("amm_config"), new BN(ammConfigIndex).toArrayLike(Buffer, "be", 2)],
    program.programId
  );
  console.log("\n步骤 3: AmmConfig:", ammConfig.toBase58());

  // Step 4: Create pool
  console.log("\n步骤 4: 创建流动性池...");
  
  const [poolState] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), ammConfig.toBuffer(), tokenMint0.toBuffer(), tokenMint1.toBuffer()],
    program.programId
  );
  const [tokenVault0] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), poolState.toBuffer(), tokenMint0.toBuffer()],
    program.programId
  );
  const [tokenVault1] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), poolState.toBuffer(), tokenMint1.toBuffer()],
    program.programId
  );
  const [observationState] = PublicKey.findProgramAddressSync(
    [Buffer.from("observation"), poolState.toBuffer()],
    program.programId
  );
  const [tickArrayBitmap] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_tick_array_bitmap_extension"), poolState.toBuffer()],
    program.programId
  );

  const sqrtPriceX64 = new BN("18446744073709551616"); // 2^64 = price 1:1
  const openTime = new BN(0);

  await program.methods
    .createPool(sqrtPriceX64, openTime)
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
      tokenProgram0: TOKEN_PROGRAM_ID,
      tokenProgram1: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
  console.log("Pool State:", poolState.toBase58());

  // Step 5: Open position and add liquidity
  console.log("\n步骤 5: 开仓并添加流动性...");
  
  const tickSpacing = 60; // From AmmConfig
  const tickLowerIndex = -120; // price range
  const tickUpperIndex = 120;
  
  // Calculate tick array start indices (must be divisible by tickSpacing * TICK_ARRAY_SIZE)
  const TICK_ARRAY_SIZE = 60;
  const tickArrayLowerStartIndex = Math.floor(tickLowerIndex / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);
  const tickArrayUpperStartIndex = Math.floor(tickUpperIndex / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);

  const positionNftMint = Keypair.generate();
  
  const [personalPosition] = PublicKey.findProgramAddressSync(
    [Buffer.from("position"), positionNftMint.publicKey.toBuffer()],
    program.programId
  );
  // Helper to convert i32 to big-endian bytes
  const i32ToBe = (num: number) => {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(num, 0);
    return buf;
  };

  const [tickArrayLower] = PublicKey.findProgramAddressSync(
    [Buffer.from("tick_array"), poolState.toBuffer(), i32ToBe(tickArrayLowerStartIndex)],
    program.programId
  );
  const [tickArrayUpper] = PublicKey.findProgramAddressSync(
    [Buffer.from("tick_array"), poolState.toBuffer(), i32ToBe(tickArrayUpperStartIndex)],
    program.programId
  );

  // Derive position NFT account
  const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
  const positionNftAccount = getAssociatedTokenAddressSync(
    positionNftMint.publicKey,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const liquidity = new BN("1000000000"); // Add 1 token worth of liquidity
  const amount0Max = new BN("100000000000"); // 100 tokens max
  const amount1Max = new BN("100000000000");

  try {
    await program.methods
      .openPositionWithToken22Nft(
        tickLowerIndex,
        tickUpperIndex,
        tickArrayLowerStartIndex,
        tickArrayUpperStartIndex,
        liquidity,
        amount0Max,
        amount1Max,
        true, // with_metadata
        null  // base_flag
      )
      .accounts({
        payer: wallet.publicKey,
        positionNftOwner: wallet.publicKey,
        positionNftMint: positionNftMint.publicKey,
        positionNftAccount,
        poolState,
        protocolPosition: PublicKey.default,
        tickArrayLower,
        tickArrayUpper,
        personalPosition,
        tokenAccount0: userTokenAccount0.address,
        tokenAccount1: userTokenAccount1.address,
        tokenVault0,
        tokenVault1,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenProgram2022: TOKEN_2022_PROGRAM_ID,
        vault0Mint: tokenMint0,
        vault1Mint: tokenMint1,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: tickArrayBitmap, isSigner: false, isWritable: true },
      ])
      .signers([positionNftMint])
      .rpc();
    
    console.log("✅ 开仓成功!");
    console.log("Position NFT:", positionNftMint.publicKey.toBase58());
  } catch (e: any) {
    console.log("开仓失败:", e.message);
    if (e.logs) {
      console.log("日志:", e.logs.slice(-10).join("\n"));
    }
    return;
  }

  // Check vault balances
  const vault0After = await getAccount(provider.connection, tokenVault0);
  const vault1After = await getAccount(provider.connection, tokenVault1);
  console.log(`Vault 0 余额: ${vault0After.amount}`);
  console.log(`Vault 1 余额: ${vault1After.amount}`);

  // Step 6: Perform swap
  console.log("\n步骤 6: 执行 Swap...");
  
  const swapAmount = new BN("1000000"); // 0.001 tokens (small amount for test)
  const minAmountOut = new BN("1"); // minimum output
  const sqrtPriceLimitX64 = new BN(0); // no price limit

  // For swap, we need tick arrays containing current tick and potential cross ticks
  // Current tick is 0, position covers -120 to 120
  // tickArrayUpper (start=0) contains tick 0
  // tickArrayLower (start=-3600) contains tick -120
  console.log("Tick Array Upper (start=0):", tickArrayUpper.toBase58());
  console.log("Tick Array Lower (start=-3600):", tickArrayLower.toBase58());

  // Get balances before swap
  const user0Before = await getAccount(provider.connection, userTokenAccount0.address);
  const user1Before = await getAccount(provider.connection, userTokenAccount1.address);
  console.log(`Swap 前 - Token 0: ${user0Before.amount}, Token 1: ${user1Before.amount}`);

  try {
    await program.methods
      .swapV2(swapAmount, minAmountOut, sqrtPriceLimitX64, true) // is_base_input = true
      .accounts({
        payer: wallet.publicKey,
        ammConfig,
        poolState,
        inputTokenAccount: userTokenAccount0.address,
        outputTokenAccount: userTokenAccount1.address,
        inputVault: tokenVault0,
        outputVault: tokenVault1,
        observationState,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenProgram2022: TOKEN_2022_PROGRAM_ID,
        memoProgram: MEMO_PROGRAM_ID,
        inputVaultMint: tokenMint0,
        outputVaultMint: tokenMint1,
      })
      .remainingAccounts([
        { pubkey: tickArrayBitmap, isSigner: false, isWritable: true },
        { pubkey: tickArrayUpper, isSigner: false, isWritable: true },
        { pubkey: tickArrayLower, isSigner: false, isWritable: true },
      ])
      .rpc();

    // Get balances after swap
    const user0After = await getAccount(provider.connection, userTokenAccount0.address);
    const user1After = await getAccount(provider.connection, userTokenAccount1.address);
    console.log(`Swap 后 - Token 0: ${user0After.amount}, Token 1: ${user1After.amount}`);
    
    const token0Change = BigInt(user0Before.amount) - BigInt(user0After.amount);
    const token1Change = BigInt(user1After.amount) - BigInt(user1Before.amount);
    console.log(`\n✅ Swap 成功!`);
    console.log(`Token 0 支出: ${token0Change}`);
    console.log(`Token 1 收到: ${token1Change}`);
  } catch (e: any) {
    console.log("❌ Swap 失败:", e.message);
    if (e.logs) {
      console.log("\n日志:");
      e.logs.forEach((log: string) => console.log(log));
    }
  }
})();
