import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import idl from "../target/idl/amm_v3.json";

// Create a liquidity pool with two test tokens

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(idl as any, provider);
  const wallet = provider.wallet as anchor.Wallet;

  console.log("=== 创建流动性池 ===\n");

  // Step 1: Create two test tokens
  console.log("步骤 1: 创建测试代币...");
  
  const mintAuthority = wallet.payer;
  
  // Create Token A
  const tokenAMint = await createMint(
    provider.connection,
    wallet.payer,
    mintAuthority.publicKey,
    null,
    9, // decimals
    Keypair.generate(),
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log("Token A Mint:", tokenAMint.toBase58());

  // Create Token B
  const tokenBMint = await createMint(
    provider.connection,
    wallet.payer,
    mintAuthority.publicKey,
    null,
    9, // decimals
    Keypair.generate(),
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log("Token B Mint:", tokenBMint.toBase58());

  // Sort tokens - token_mint_0 must be < token_mint_1
  let tokenMint0: PublicKey, tokenMint1: PublicKey;
  if (tokenAMint.toBuffer().compare(tokenBMint.toBuffer()) < 0) {
    tokenMint0 = tokenAMint;
    tokenMint1 = tokenBMint;
  } else {
    tokenMint0 = tokenBMint;
    tokenMint1 = tokenAMint;
  }
  console.log("Token 0 (smaller):", tokenMint0.toBase58());
  console.log("Token 1 (larger):", tokenMint1.toBase58());

  // Step 2: Use existing AmmConfig (index 0)
  const ammConfigIndex = 0;
  const [ammConfig] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("amm_config"),
      new anchor.BN(ammConfigIndex).toArrayLike(Buffer, "be", 2),
    ],
    program.programId
  );
  console.log("\n步骤 2: 使用 AmmConfig:", ammConfig.toBase58());

  // Step 3: Derive pool state PDA
  const [poolState] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      ammConfig.toBuffer(),
      tokenMint0.toBuffer(),
      tokenMint1.toBuffer(),
    ],
    program.programId
  );
  console.log("\n步骤 3: Pool State PDA:", poolState.toBase58());

  // Derive other PDAs
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

  console.log("Token Vault 0:", tokenVault0.toBase58());
  console.log("Token Vault 1:", tokenVault1.toBase58());
  console.log("Observation State:", observationState.toBase58());
  console.log("Tick Array Bitmap:", tickArrayBitmap.toBase58());

  // Step 4: Create pool
  console.log("\n步骤 4: 创建流动性池...");
  
  // Initial price: 1:1 ratio, sqrt(1) * 2^64 = 2^64
  const sqrtPriceX64 = new anchor.BN("18446744073709551616"); // 2^64
  const openTime = new anchor.BN(0); // Already open (must be < current time)

  try {
    const tx = await program.methods
      .createPool(sqrtPriceX64, openTime)
      .accounts({
        poolCreator: wallet.publicKey,
        ammConfig: ammConfig,
        poolState: poolState,
        tokenMint0: tokenMint0,
        tokenMint1: tokenMint1,
        tokenVault0: tokenVault0,
        tokenVault1: tokenVault1,
        observationState: observationState,
        tickArrayBitmap: tickArrayBitmap,
        tokenProgram0: TOKEN_PROGRAM_ID,
        tokenProgram1: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("✅ 流动性池创建成功!");
    console.log("交易签名:", tx);
    console.log("\n=== 池信息 ===");
    console.log("Pool State:", poolState.toBase58());
    console.log("Token 0:", tokenMint0.toBase58());
    console.log("Token 1:", tokenMint1.toBase58());
    console.log("AmmConfig:", ammConfig.toBase58());
  } catch (e: any) {
    console.log("❌ 创建失败:", e.message);
    if (e.logs) {
      console.log("\n日志:");
      e.logs.forEach((log: string) => console.log(log));
    }
  }
})();
