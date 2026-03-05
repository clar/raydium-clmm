import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import idl from "../target/idl/amm_v3.json";

// New pool (correct price, AmmConfig index=1)
const POOL = new PublicKey("2QpkNT4Jd4s4SijMYuZqf8enf9XJCBvrS4LhQA5zNj5J");
const POSITION_NFTS = [
  "4gNie85QUPkJqiMshSFSxw3DixUzrRq8trbB1U2b3BdJ",
  "Fwn537HVtNB65x8PXwDDu41D9gbNF7pDkp12YjkNbajS",
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

  console.log("=== 撤出新池子重复 positions ===\n");

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
    [Buffer.from("pool_vault"), POOL.toBuffer(), tokenMint0.toBuffer()], program.programId);
  const [tokenVault1] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), POOL.toBuffer(), tokenMint1.toBuffer()], program.programId);
  const [tickArrayBitmap] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_tick_array_bitmap_extension"), POOL.toBuffer()], program.programId);

  const userAta0 = await getOrCreateAssociatedTokenAccount(
    conn, wallet.payer, tokenMint0, wallet.publicKey, false, undefined, undefined, tokenProgram0);
  const userAta1 = await getOrCreateAssociatedTokenAccount(
    conn, wallet.payer, tokenMint1, wallet.publicKey, false, undefined, undefined, tokenProgram1);

  for (const nftStr of POSITION_NFTS) {
    const nftMint = new PublicKey(nftStr);
    const [personalPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), nftMint.toBuffer()], program.programId);

    console.log(`\n--- Position NFT: ${nftStr} ---`);
    let pos: any;
    try {
      pos = await (program.account as any).personalPositionState.fetch(personalPosition);
    } catch {
      console.log("  跳过: position 不存在");
      continue;
    }

    console.log(`  liquidity: ${pos.liquidity.toString()}, ticks: [${pos.tickLowerIndex}, ${pos.tickUpperIndex}]`);

    if (!pos.liquidity.isZero()) {
      const tickSpacing = 60, TICK_ARRAY_SIZE = 60;
      const tickArrayLowerStart = Math.floor(pos.tickLowerIndex / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);
      const tickArrayUpperStart = Math.floor(pos.tickUpperIndex / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);
      const [tickArrayLower] = PublicKey.findProgramAddressSync(
        [Buffer.from("tick_array"), POOL.toBuffer(), i32ToBe(tickArrayLowerStart)], program.programId);
      const [tickArrayUpper] = PublicKey.findProgramAddressSync(
        [Buffer.from("tick_array"), POOL.toBuffer(), i32ToBe(tickArrayUpperStart)], program.programId);
      const [protocolPosition] = PublicKey.findProgramAddressSync(
        [Buffer.from("protocol_position"), POOL.toBuffer(), i32ToBe(pos.tickLowerIndex), i32ToBe(pos.tickUpperIndex)], program.programId);
      const nftAccount = getAssociatedTokenAddressSync(nftMint, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);

      try {
        const tx = await program.methods.decreaseLiquidityV2(pos.liquidity, new BN(0), new BN(0))
          .accounts({
            nftOwner: wallet.publicKey, nftAccount, poolState: POOL, protocolPosition, personalPosition,
            tickArrayLower, tickArrayUpper,
            recipientTokenAccount0: userAta0.address, recipientTokenAccount1: userAta1.address,
            tokenVault0, tokenVault1,
            tokenProgram: TOKEN_PROGRAM_ID, tokenProgram2022: TOKEN_2022_PROGRAM_ID,
            vault0Mint: tokenMint0, vault1Mint: tokenMint1,
            memoProgram: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
          })
          .remainingAccounts([{ pubkey: tickArrayBitmap, isSigner: false, isWritable: true }])
          .rpc();
        console.log(`  撤出成功: ${tx}`);
      } catch (e: any) {
        console.log("  撤出失败:", e.message);
        continue;
      }
    }

    // Close position
    const nftAccount = getAssociatedTokenAddressSync(nftMint, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
    try {
      const tx = await program.methods.closePosition()
        .accounts({
          nftOwner: wallet.publicKey, positionNftMint: nftMint, positionNftAccount: nftAccount,
          personalPosition, systemProgram: SystemProgram.programId, tokenProgram: TOKEN_2022_PROGRAM_ID,
        }).rpc();
      console.log(`  关仓成功: ${tx}`);
    } catch (e: any) {
      console.log("  关仓失败:", e.message);
    }
  }

  const v0 = await getAccount(conn, tokenVault0, undefined, tokenProgram0);
  const v1 = await getAccount(conn, tokenVault1, undefined, tokenProgram1);
  console.log("\n=== Vault 余额 ===");
  console.log("TSLAx:", Number(v0.amount) / 1e8);
  console.log("USDC:", Number(v1.amount) / 1e6);
})();
