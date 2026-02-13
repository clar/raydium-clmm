import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../target/idl/amm_v3.json";

// Test fork behavior: non-zero protocol_fee_rate and fund_fee_rate should fail

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(idl as any, provider);

  console.log("=== Raydium CLMM Fork 行为验证 ===\n");

  // Test 1: protocol_fee_rate != 0 should fail
  console.log("测试 1: protocol_fee_rate != 0 应失败");
  const index1 = 1; // Use different index
  const [ammConfig1] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("amm_config"),
      new anchor.BN(index1).toArrayLike(Buffer, "be", 2),
    ],
    program.programId,
  );

  try {
    await program.methods
      .createAmmConfig(
        index1,
        60, // tickSpacing
        2500, // tradeFeeRate: 0.25%
        100, // protocolFeeRate: non-zero!
        0, // fundFeeRate
      )
      .accounts({
        ammConfig: ammConfig1,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("❌ 失败: 应该抛出错误但没有\n");
  } catch (e: any) {
    if (e.message?.includes("NonZeroProtocolOrFundFeeNotAllowed") || 
        e.logs?.some((l: string) => l.includes("NonZeroProtocolOrFundFeeNotAllowed"))) {
      console.log("✅ 成功: 正确拒绝了非零 protocol_fee_rate\n");
    } else {
      console.log("❌ 失败: 错误类型不符预期:", e.message, "\n");
    }
  }

  // Test 2: fund_fee_rate != 0 should fail
  console.log("测试 2: fund_fee_rate != 0 应失败");
  const index2 = 2;
  const [ammConfig2] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("amm_config"),
      new anchor.BN(index2).toArrayLike(Buffer, "be", 2),
    ],
    program.programId,
  );

  try {
    await program.methods
      .createAmmConfig(
        index2,
        60, // tickSpacing
        2500, // tradeFeeRate
        0, // protocolFeeRate
        100, // fundFeeRate: non-zero!
      )
      .accounts({
        ammConfig: ammConfig2,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("❌ 失败: 应该抛出错误但没有\n");
  } catch (e: any) {
    if (e.message?.includes("NonZeroProtocolOrFundFeeNotAllowed") || 
        e.logs?.some((l: string) => l.includes("NonZeroProtocolOrFundFeeNotAllowed"))) {
      console.log("✅ 成功: 正确拒绝了非零 fund_fee_rate\n");
    } else {
      console.log("❌ 失败: 错误类型不符预期:", e.message, "\n");
    }
  }

  // Test 3: both == 0 should succeed
  console.log("测试 3: protocol_fee_rate == 0 且 fund_fee_rate == 0 应成功");
  const index3 = 3;
  const [ammConfig3] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("amm_config"),
      new anchor.BN(index3).toArrayLike(Buffer, "be", 2),
    ],
    program.programId,
  );

  try {
    await program.methods
      .createAmmConfig(
        index3,
        60, // tickSpacing
        2500, // tradeFeeRate
        0, // protocolFeeRate: zero
        0, // fundFeeRate: zero
      )
      .accounts({
        ammConfig: ammConfig3,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("✅ 成功: AmmConfig 创建成功:", ammConfig3.toBase58(), "\n");
  } catch (e: any) {
    console.log("❌ 失败: 应该成功但失败了:", e.message, "\n");
  }

  console.log("=== 验证完成 ===");
})();
