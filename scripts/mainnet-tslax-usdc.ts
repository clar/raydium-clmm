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

// TSLAx: Token-2022, 8 decimals
const TSLAX_MINT = new PublicKey("XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB");
const TSLAX_PROGRAM = TOKEN_2022_PROGRAM_ID;
const TSLAX_DECIMALS = 8;

// USDC: SPL Token, 6 decimals
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDC_PROGRAM = TOKEN_PROGRAM_ID;
const USDC_DECIMALS = 6;

const AMM_CONFIG_INDEX = 1;  // index 0 had wrong-price pool
const TSLAX_PRICE = 394.4;

const i32ToBe = (num: number) => {
  const buf = Buffer.alloc(4);
  buf.writeInt32BE(num, 0);
  return buf;
};

interface CostEntry {
  step: string;
  sol: number;
  recoverable: boolean;
  tx?: string;
}

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(idl as any, provider);
  const wallet = provider.wallet as anchor.Wallet;
  const conn = provider.connection;

  const costs: CostEntry[] = [];
  const getBalance = async () => (await conn.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL;

  console.log("=== TSLAx/USDC 主网池子创建与测试 ===\n");
  console.log("Program:", program.programId.toBase58());
  console.log("Wallet:", wallet.publicKey.toBase58());

  const startBalance = await getBalance();
  console.log(`初始余额: ${startBalance} SOL\n`);

  // Sort tokens: mint0 < mint1
  let tokenMint0: PublicKey, tokenMint1: PublicKey;
  let tokenProgram0: PublicKey, tokenProgram1: PublicKey;
  let decimals0: number, decimals1: number;
  let label0: string, label1: string;

  if (TSLAX_MINT.toBuffer().compare(USDC_MINT.toBuffer()) < 0) {
    tokenMint0 = TSLAX_MINT; tokenMint1 = USDC_MINT;
    tokenProgram0 = TSLAX_PROGRAM; tokenProgram1 = USDC_PROGRAM;
    decimals0 = TSLAX_DECIMALS; decimals1 = USDC_DECIMALS;
    label0 = "TSLAx"; label1 = "USDC";
  } else {
    tokenMint0 = USDC_MINT; tokenMint1 = TSLAX_MINT;
    tokenProgram0 = USDC_PROGRAM; tokenProgram1 = TSLAX_PROGRAM;
    decimals0 = USDC_DECIMALS; decimals1 = TSLAX_DECIMALS;
    label0 = "USDC"; label1 = "TSLAx";
  }

  console.log(`Token 0 (${label0}): ${tokenMint0.toBase58()} (${decimals0} decimals, ${tokenProgram0.equals(TOKEN_2022_PROGRAM_ID) ? "Token-2022" : "SPL Token"})`);
  console.log(`Token 1 (${label1}): ${tokenMint1.toBase58()} (${decimals1} decimals, ${tokenProgram1.equals(TOKEN_2022_PROGRAM_ID) ? "Token-2022" : "SPL Token"})`);

  // ========== Step 1: Create AmmConfig ==========
  console.log("\n--- 步骤 1: 创建 AmmConfig ---");
  let balBefore = await getBalance();

  const [ammConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("amm_config"), new BN(AMM_CONFIG_INDEX).toArrayLike(Buffer, "be", 2)],
    program.programId,
  );

  let ammConfigExists = false;
  try {
    const info = await conn.getAccountInfo(ammConfig);
    if (info) {
      ammConfigExists = true;
      console.log("AmmConfig 已存在:", ammConfig.toBase58());
    }
  } catch {}

  if (!ammConfigExists) {
    const tx = await program.methods
      .createAmmConfig(AMM_CONFIG_INDEX, 60, 2500, 0, 0)
      .accounts({
        ammConfig,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const cost = balBefore - (await getBalance());
    costs.push({ step: "创建 AmmConfig", sol: cost, recoverable: true, tx });
    console.log(`AmmConfig: ${ammConfig.toBase58()}`);
    console.log(`消耗: ${cost.toFixed(6)} SOL | 签名: ${tx}`);
  }

  // ========== Step 1.5: Whitelist TSLAx (Token-2022 with freeze extension) ==========
  console.log("\n--- 步骤 1.5: 白名单 TSLAx mint ---");
  balBefore = await getBalance();

  const [supportMintAssociated] = PublicKey.findProgramAddressSync(
    [Buffer.from("support_mint"), TSLAX_MINT.toBuffer()],
    program.programId,
  );

  let supportMintExists = false;
  try {
    const info = await conn.getAccountInfo(supportMintAssociated);
    if (info) {
      supportMintExists = true;
      console.log("TSLAx 已白名单:", supportMintAssociated.toBase58());
    }
  } catch {}

  if (!supportMintExists) {
    const tx = await program.methods
      .createSupportMintAssociated()
      .accounts({
        owner: wallet.publicKey,
        tokenMint: TSLAX_MINT,
        supportMintAssociated,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const cost = balBefore - (await getBalance());
    costs.push({ step: "白名单 TSLAx mint", sol: cost, recoverable: true, tx });
    console.log(`TSLAx 白名单完成: ${supportMintAssociated.toBase58()}`);
    console.log(`消耗: ${cost.toFixed(6)} SOL | 签名: ${tx}`);
  }

  // ========== Step 2: Get user token accounts ==========
  console.log("\n--- 步骤 2: 检查代币余额 ---");
  balBefore = await getBalance();

  const userTokenAccount0 = await getOrCreateAssociatedTokenAccount(
    conn, wallet.payer, tokenMint0, wallet.publicKey, false, undefined, undefined, tokenProgram0
  );
  const userTokenAccount1 = await getOrCreateAssociatedTokenAccount(
    conn, wallet.payer, tokenMint1, wallet.publicKey, false, undefined, undefined, tokenProgram1
  );

  const ataCreateCost = balBefore - (await getBalance());
  if (ataCreateCost > 0.0001) {
    costs.push({ step: "创建 ATA 账户", sol: ataCreateCost, recoverable: true });
  }

  const bal0 = Number(userTokenAccount0.amount) / 10 ** decimals0;
  const bal1 = Number(userTokenAccount1.amount) / 10 ** decimals1;
  console.log(`${label0}: ${bal0}`);
  console.log(`${label1}: ${bal1}`);

  if (bal0 === 0 && bal1 === 0) {
    console.log("\n⚠️  你需要先获取一些 TSLAx 和 USDC 才能添加流动性和测试 swap");
    console.log("可以从交易所转入，或通过其他 DEX 兑换");
    console.log("\n继续创建池子（不需要代币）...");
  }

  // ========== Step 3: Create Pool ==========
  console.log("\n--- 步骤 3: 创建 TSLAx/USDC 池子 ---");
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
    // TSLAx/USDC price ~394.4 USDC
    // CLMM rawPrice = token1_smallest / token0_smallest
    // To convert human price to raw:
    //   rawPrice = humanPrice * 10^decimals1 / 10^decimals0
    //   (NOT decimals0/decimals1 — that was the previous bug)

    let price: number;
    if (label0 === "USDC") {
      // token0 = USDC, token1 = TSLAx
      // 1 TSLAx = 394.4 USDC → price(token1/token0) = 1/394.4
      // rawPrice = (1/394.4) * 10^decimals1 / 10^decimals0
      price = (1 / TSLAX_PRICE) * Math.pow(10, decimals1) / Math.pow(10, decimals0);
    } else {
      // token0 = TSLAx, token1 = USDC
      // 1 TSLAx = 394.4 USDC → price(token1/token0) = 394.4
      // rawPrice = 394.4 * 10^decimals1 / 10^decimals0 = 394.4 * 10^6 / 10^8 = 3.944
      price = TSLAX_PRICE * Math.pow(10, decimals1) / Math.pow(10, decimals0);
    }

    const sqrtPrice = Math.sqrt(price);
    const TWO_POW_64 = 2n ** 64n;
    const sqrtPriceX64 = BigInt(Math.floor(sqrtPrice * Number(TWO_POW_64)));
    console.log(`初始价格: 1 TSLAx = ${TSLAX_PRICE} USDC`);
    console.log(`排列: token0=${label0}, token1=${label1}`);
    console.log(`raw price: ${price}`);
    console.log(`sqrtPriceX64: ${sqrtPriceX64.toString()}`);

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
    costs.push({ step: "创建池子 (PoolState + Vault + Observation + Bitmap)", sol: cost, recoverable: true, tx });
    console.log(`Pool: ${poolState.toBase58()}`);
    console.log(`消耗: ${cost.toFixed(6)} SOL | 签名: ${tx}`);
  }

  console.log(`\nPool State: ${poolState.toBase58()}`);
  console.log(`Token Vault 0: ${tokenVault0.toBase58()}`);
  console.log(`Token Vault 1: ${tokenVault1.toBase58()}`);
  console.log(`Observation: ${observationState.toBase58()}`);

  // ========== Step 4: Open position and add liquidity ==========
  if (bal0 > 0 || bal1 > 0) {
    console.log("\n--- 步骤 4: 开仓并添加流动性 ---");
    balBefore = await getBalance();

    const tickSpacing = 60;
    const TICK_ARRAY_SIZE = 60;

    // 设置一个 ±10% 的价格范围
    // 使用 tick_math: tick = log(price) / log(1.0001)
    // 价格范围: 369~451 USDC (约 ±10%)
    // 需要对齐到 tickSpacing
    // tick = log(rawPrice) / log(1.0001), rawPrice uses decimals1/decimals0
    const rawPriceForTick = TSLAX_PRICE * Math.pow(10, decimals1) / Math.pow(10, decimals0);
    const currentTick = Math.round(Math.log(rawPriceForTick) / Math.log(1.0001));

    // ±10% 价格范围，对齐到 tickSpacing
    const tickLower = Math.floor((currentTick - 1000) / tickSpacing) * tickSpacing;
    const tickUpper = Math.ceil((currentTick + 1000) / tickSpacing) * tickSpacing;

    console.log(`Current tick: ${currentTick}`);
    console.log(`Tick range: [${tickLower}, ${tickUpper}]`);

    const tickArrayLowerStart = Math.floor(tickLower / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);
    const tickArrayUpperStart = Math.floor(tickUpper / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);

    const positionNftMint = Keypair.generate();

    const [personalPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), positionNftMint.publicKey.toBuffer()],
      program.programId,
    );
    const [protocolPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol_position"), poolState.toBuffer(), i32ToBe(tickLower), i32ToBe(tickUpper)],
      program.programId,
    );
    const [tickArrayLower] = PublicKey.findProgramAddressSync(
      [Buffer.from("tick_array"), poolState.toBuffer(), i32ToBe(tickArrayLowerStart)],
      program.programId,
    );
    const [tickArrayUpper] = PublicKey.findProgramAddressSync(
      [Buffer.from("tick_array"), poolState.toBuffer(), i32ToBe(tickArrayUpperStart)],
      program.programId,
    );

    const positionNftAccount = getAssociatedTokenAddressSync(
      positionNftMint.publicKey,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    // 使用 base_flag 让程序根据 USDC 金额自动计算 liquidity
    // 目标: ~5 USDC + 等值 TSLAx (~0.013 TSLAx ≈ $5)
    const liquidity = new BN(0);
    const amount0Max = new BN((0.03 * 10 ** decimals0).toString());  // max 0.03 TSLAx (~$12)
    const amount1Max = new BN((6 * 10 ** decimals1).toString());     // max 6 USDC

    try {
      const openPosBuilder = program.methods
        .openPositionWithToken22Nft(
          tickLower,
          tickUpper,
          tickArrayLowerStart,
          tickArrayUpperStart,
          liquidity,
          amount0Max,
          amount1Max,
          true,
          false,  // base_flag: calculate liquidity based on amount_1 (USDC)
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
        .signers([positionNftMint]);

      // First simulate to get logs
      const simTx = await openPosBuilder.transaction();
      simTx.feePayer = wallet.publicKey;
      simTx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
      const simResult = await conn.simulateTransaction(simTx, [wallet.payer, positionNftMint]);
      if (simResult.value.err) {
        console.log("模拟失败:", JSON.stringify(simResult.value.err));
        if (simResult.value.logs) {
          console.log("模拟日志:");
          simResult.value.logs.forEach((l: string) => console.log("  ", l));
        }
        throw new Error("Simulation failed");
      }

      const tx = await openPosBuilder.rpc();

      const cost = balBefore - (await getBalance());
      costs.push({ step: "开仓 + 添加流动性 (Position + TickArrays)", sol: cost, recoverable: true, tx });
      console.log(`✅ 开仓成功!`);
      console.log(`Position NFT: ${positionNftMint.publicKey.toBase58()}`);
      console.log(`消耗: ${cost.toFixed(6)} SOL | 签名: ${tx}`);

      const v0 = await getAccount(conn, tokenVault0, undefined, tokenProgram0);
      const v1 = await getAccount(conn, tokenVault1, undefined, tokenProgram1);
      console.log(`Vault ${label0}: ${Number(v0.amount) / 10 ** decimals0}`);
      console.log(`Vault ${label1}: ${Number(v1.amount) / 10 ** decimals1}`);

      // ========== Step 5: Swap ==========
      console.log("\n--- 步骤 5: 执行 Swap ---");
      balBefore = await getBalance();

      const user0Before = await getAccount(conn, userTokenAccount0.address, undefined, tokenProgram0);
      const user1Before = await getAccount(conn, userTokenAccount1.address, undefined, tokenProgram1);

      // Swap: 用少量 USDC (token1) 买 TSLAx (token0)
      const swapAmount = new BN((0.1 * 10 ** decimals1).toString()); // 0.1 USDC

      // 需要传入当前 tick 对应的 tick array
      // 从池子读取当前 tick
      const poolData = await program.account.poolState.fetch(poolState);
      const poolTick = (poolData as any).tickCurrent;
      console.log(`Pool current tick: ${poolTick}`);

      const tickArrayStart0 = Math.floor(poolTick / (tickSpacing * TICK_ARRAY_SIZE)) * (tickSpacing * TICK_ARRAY_SIZE);
      const [swapTickArray0] = PublicKey.findProgramAddressSync(
        [Buffer.from("tick_array"), poolState.toBuffer(), i32ToBe(tickArrayStart0)],
        program.programId,
      );

      // Deduplicate tick arrays to avoid RefCell double-borrow panic
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

      const swapBuilder = program.methods
        .swapV2(swapAmount, new BN(1), new BN(0), true)
        .accounts({
          payer: wallet.publicKey,
          ammConfig,
          poolState,
          inputTokenAccount: userTokenAccount1.address,  // USDC in
          outputTokenAccount: userTokenAccount0.address,  // TSLAx out
          inputVault: tokenVault1,   // USDC vault
          outputVault: tokenVault0,  // TSLAx vault
          observationState,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenProgram2022: TOKEN_2022_PROGRAM_ID,
          memoProgram: MEMO_PROGRAM_ID,
          inputVaultMint: tokenMint1,   // USDC mint
          outputVaultMint: tokenMint0,  // TSLAx mint
        })
        .remainingAccounts(tickArrayAccounts);

      // Simulate first
      const swapSimTx = await swapBuilder.transaction();
      swapSimTx.feePayer = wallet.publicKey;
      swapSimTx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
      const swapSim = await conn.simulateTransaction(swapSimTx, [wallet.payer]);
      if (swapSim.value.err) {
        console.log("Swap 模拟失败:", JSON.stringify(swapSim.value.err));
        if (swapSim.value.logs) {
          console.log("Swap 模拟日志:");
          swapSim.value.logs.slice(-10).forEach((l: string) => console.log("  ", l));
        }
        throw new Error("Swap simulation failed");
      }

      const swapTx = await swapBuilder.rpc();

      const user0After = await getAccount(conn, userTokenAccount0.address, undefined, tokenProgram0);
      const user1After = await getAccount(conn, userTokenAccount1.address, undefined, tokenProgram1);

      const in0 = Number(BigInt(user0Before.amount) - BigInt(user0After.amount)) / 10 ** decimals0;
      const out1 = Number(BigInt(user1After.amount) - BigInt(user1Before.amount)) / 10 ** decimals1;

      const swapCost = balBefore - (await getBalance());
      costs.push({ step: "Swap 交易费", sol: swapCost, recoverable: false, tx: swapTx });

      console.log(`✅ Swap 成功!`);
      console.log(`输入: ${in0} ${label0}`);
      console.log(`输出: ${out1} ${label1}`);
      console.log(`消耗: ${swapCost.toFixed(6)} SOL | 签名: ${swapTx}`);
    } catch (e: any) {
      console.log("❌ 操作失败:", e.message || e);
      if (e.logs) {
        console.log("日志:");
        e.logs.forEach((l: string) => console.log("  ", l));
      }
      if (e.getLogs) {
        try {
          const logs = await e.getLogs(conn);
          console.log("详细日志:");
          logs.forEach((l: string) => console.log("  ", l));
        } catch {}
      }
      if (e.getLogs) {
        try {
          const logs2 = await e.getLogs(conn);
          if (logs2) {
            console.log("交易日志:");
            for (const l of logs2) console.log("  ", l);
          }
        } catch {}
      }
    }
  } else {
    console.log("\n--- 步骤 4 & 5: 跳过（没有 TSLAx/USDC 余额） ---");
    console.log("池子已创建，但需要 TSLAx 和 USDC 才能添加流动性和 swap");
  }

  // ========== 汇总 ==========
  const endBalance = await getBalance();
  const totalCost = startBalance - endBalance;

  console.log("\n========================================");
  console.log("SOL 消耗汇总");
  console.log("========================================\n");

  let totalRecoverable = 0;
  let totalNonRecoverable = 0;

  for (const c of costs) {
    const tag = c.recoverable ? "✅ 可回收" : "❌ 不可回收";
    console.log(`${c.step}: ${c.sol.toFixed(6)} SOL (${tag})`);
    if (c.tx) console.log(`  签名: ${c.tx}`);
    if (c.recoverable) totalRecoverable += c.sol;
    else totalNonRecoverable += c.sol;
  }

  console.log("\n----------------------------------------");
  console.log(`总消耗:     ${totalCost.toFixed(6)} SOL`);
  console.log(`可回收:     ${totalRecoverable.toFixed(6)} SOL (账户租金押金，关闭账户时退回)`);
  console.log(`不可回收:   ${totalNonRecoverable.toFixed(6)} SOL (交易手续费)`);
  console.log(`初始余额:   ${startBalance.toFixed(6)} SOL`);
  console.log(`剩余余额:   ${endBalance.toFixed(6)} SOL`);
  console.log("========================================\n");

  console.log("池子信息:");
  console.log(`  Program:    ${program.programId.toBase58()}`);
  console.log(`  Pool:       ${poolState.toBase58()}`);
  console.log(`  AmmConfig:  ${ammConfig.toBase58()}`);
  console.log(`  ${label0}: ${tokenMint0.toBase58()}`);
  console.log(`  ${label1}: ${tokenMint1.toBase58()}`);
  console.log(`  Fee: 0.25% (全归 LP, protocol=0, fund=0)`);
})();
