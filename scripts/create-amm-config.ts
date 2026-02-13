import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../target/idl/amm_v3.json";

// 0 is the index for this new config
// should be unique
const index = 0;

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(idl as any, provider);

  // Derive AmmConfig PDA
  const [ammConfig] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("amm_config"),
      new anchor.BN(index).toArrayLike(Buffer, "be", 2),
    ],
    program.programId,
  );

  await program.methods
    .createAmmConfig(
      index,
      60, // tickSpacing
      2500, // tradeFeeRate: 0.25%
      0, // protocolFeeRate
      0, // fundFeeRate
    )
    .accounts({
      ammConfig: ammConfig,
      owner: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("AmmConfig created:", ammConfig.toBase58());
})();
