import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import idl from "../target/idl/amm_v3.json";

// Old pool (wrong price, AmmConfig index=0)
const POOL = new PublicKey("HBs5ufwcDnrfcVqNv7Mamkocdnb2mBY11kF7FQyNLSkg");
const POSITION_NFTS = [
  "6qJdDAKzEW4neqnbEwvg3wjEVrd5N8HPmojGN9v3mgzC",
  "FRuA3SCNgbJf9S6XdYibdMWuqMCGojy94BPR5b2aFdAc",
];

const TSLAX_MINT = new PublicKey("XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB");
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

const i32ToBe = (num: number) => {
  const buf = Buffer.alloc(4);
  buf.writeInt32BE(num, 0);
  return buf;
};

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new Program(idl as any, provider);
  const wallet = provider.wallet as anchor.Wallet;
  const conn = provider.connection;

  console.log("=== 撤出旧池子流动性 ===\n");
  console.log("Pool:", POOL.toBase58());

  // Sort tokens
  let tokenMint0: PublicKey, tokenMint1: PublicKey;
  let tokenProgram0: PublicKey, tokenProgram1: PublicKey;
  if (TSLAX_MINT.toBuffer().compare(USDC_MINT.toBuffer()) < 0) {
    tokenMint0 = TSLAX_MINT; tokenMint1 = USDC_MINT;
    tokenProgram0 = TOKEN_2022_PROGRAM_ID; tokenProgram1 = TOKEN_PROGRAM_ID;
  } else {
    tokenMint0 = USDC_MINT; tokenMint1 = TSLAX_MINT;
    tokenProgram0 = TOKEN_PROGRAM_ID; tokenProgram1 = TOKEN_2022_PROGRAM_ID;
  }

  const [tokenVault0] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), POOL.toBuffer(), tokenMint0.toBuffer()],
    program.programId,
  );
  const [tokenVault1] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), POOL.toBuffer(), tokenMint1.toBuffer()],
    program.programId,
  );
  const [tickArrayBitmap] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_tick_array_bitmap_extension"), POOL.toBuffer()],
    program.programId,
  );

  const userAta0 = await getOrCreateAssociatedTokenAccount(
    conn, wallet.payer, tokenMint0, wallet.publicKey, false, undefined, undefined, tokenProgram0,
  );
  const userAta1 = await getOrCreateAssociatedTokenAccount(
    conn, wallet.payer, tokenMint1, wallet.publicKey, false, undefined, undefined, tokenProgram1,
  );

  for (const nftStr of POSITION_NFTS) {
    const nftMint = new PublicKey(nftStr);
    const [personalPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), nftMint.toBuffer()],
      program.programId,
    );

    console.log(`\n--- Position NFT: ${nftStr} ---`);

    let pos: any;
    try {
      pos = await (program.account as any).personalPositionState.fetch(personalPosition);
    } catch (e: any) {
      console.log("  跳过: 无法读取 position state:", e.message);
      continue;
    }

    const liquidity = pos.liquidity;
    console.log(`  liquidity: ${liquidity.toString()}`);
    console.log(`  tickLower: ${pos.tickLowerIndex}, tickUpper: ${pos.tickUpperIndex}`);

    if (liquidity.isZero()) {
      console.log("  流动性已为 0，跳过 decrease，直接关仓...");
    } else {
      // Decrease liquidity
      const tickSpacing = 60;
      const TICK_ARRAY_SIZE = 60;
      const tickArrayLowerStart = Math.floor(pos.tickLowerIndex / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);
      const tickArrayUpperStart = Math.floor(pos.tickUpperIndex / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);

      const [tickArrayLower] = PublicKey.findProgramAddressSync(
        [Buffer.from("tick_array"), POOL.toBuffer(), i32ToBe(tickArrayLowerStart)],
        program.programId,
      );
      const [tickArrayUpper] = PublicKey.findProgramAddressSync(
        [Buffer.from("tick_array"), POOL.toBuffer(), i32ToBe(tickArrayUpperStart)],
        program.programId,
      );
      const [protocolPosition] = PublicKey.findProgramAddressSync(
        [Buffer.from("protocol_position"), POOL.toBuffer(), i32ToBe(pos.tickLowerIndex), i32ToBe(pos.tickUpperIndex)],
        program.programId,
      );

      const nftAccount = getAssociatedTokenAddressSync(
        nftMint, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID,
      );

      console.log("  撤出全部流动性...");
      try {
        const tx = await program.methods
          .decreaseLiquidityV2(liquidity, new BN(0), new BN(0))
          .accounts({
            nftOwner: wallet.publicKey,
            nftAccount,
            poolState: POOL,
            protocolPosition,
            personalPosition,
            tickArrayLower,
            tickArrayUpper,
            recipientTokenAccount0: userAta0.address,
            recipientTokenAccount1: userAta1.address,
            tokenVault0,
            tokenVault1,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenProgram2022: TOKEN_2022_PROGRAM_ID,
            vault0Mint: tokenMint0,
            vault1Mint: tokenMint1,
            memoProgram: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
          })
          .remainingAccounts([
            { pubkey: tickArrayBitmap, isSigner: false, isWritable: true },
          ])
          .rpc();
        console.log(`  撤出成功: ${tx}`);
      } catch (e: any) {
        console.log("  撤出失败:", e.message);
        if (e.logs) e.logs.slice(-5).forEach((l: string) => console.log("    ", l));
        continue;
      }
    }

    // Close position
    console.log("  关闭仓位...");
    const nftAccount = getAssociatedTokenAddressSync(
      nftMint, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID,
    );
    try {
      const tx = await program.methods
        .closePosition()
        .accounts({
          nftOwner: wallet.publicKey,
          positionNftMint: nftMint,
          positionNftAccount: nftAccount,
          personalPosition,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      console.log(`  关仓成功: ${tx}`);
    } catch (e: any) {
      console.log("  关仓失败:", e.message);
      if (e.logs) e.logs.slice(-5).forEach((l: string) => console.log("    ", l));
    }
  }

  // Check vault balances
  const v0 = await getAccount(conn, tokenVault0, undefined, tokenProgram0);
  const v1 = await getAccount(conn, tokenVault1, undefined, tokenProgram1);
  console.log("\n=== 撤出后 Vault 余额 ===");
  console.log("TSLAx vault:", Number(v0.amount) / 1e8);
  console.log("USDC vault:", Number(v1.amount) / 1e6);
})();
