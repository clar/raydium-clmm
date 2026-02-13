# 04 - 流动性池创建

## 目标

使用 `createPool` 指令创建流动性池。

---

## 执行步骤

### 4.1 创建测试代币

```typescript
const tokenAMint = await createMint(
  provider.connection,
  wallet.payer,
  mintAuthority.publicKey,
  null,
  9, // decimals
);

const tokenBMint = await createMint(...);
```

**输出:**
```
Token A Mint: 8djtxGXwWW6YQDu1DytLSA9XkKQv7b8yYh3GTVwvQ3mQ
Token B Mint: 5YBxwZ4JtcKFmYbY8zRfzhTyqjZ51nt9WXe6zb2gHNow
```

**注意:** Token 0 的地址必须小于 Token 1，脚本会自动排序。

---

### 4.2 选择 AmmConfig

使用已创建的 AmmConfig (index 0):

```
AmmConfig: GkbFNrEJebunoSCniGGa3nPV2DDA8AdrPg6kZm7ExHqZ
```

**配置参数:**
- Trade Fee Rate: 2500 (0.25%)
- Protocol Fee Rate: 0
- Fund Fee Rate: 0
- Tick Spacing: 60

---

### 4.3 推导 PDA 地址

```typescript
// Pool State PDA
const [poolState] = PublicKey.findProgramAddressSync(
  [Buffer.from("pool"), ammConfig.toBuffer(), tokenMint0.toBuffer(), tokenMint1.toBuffer()],
  program.programId
);

// Token Vault PDAs
const [tokenVault0] = PublicKey.findProgramAddressSync(
  [Buffer.from("pool_vault"), poolState.toBuffer(), tokenMint0.toBuffer()],
  program.programId
);

const [tokenVault1] = PublicKey.findProgramAddressSync(
  [Buffer.from("pool_vault"), poolState.toBuffer(), tokenMint1.toBuffer()],
  program.programId
);

// Observation State PDA
const [observationState] = PublicKey.findProgramAddressSync(
  [Buffer.from("observation"), poolState.toBuffer()],
  program.programId
);

// Tick Array Bitmap Extension PDA
const [tickArrayBitmap] = PublicKey.findProgramAddressSync(
  [Buffer.from("pool_tick_array_bitmap_extension"), poolState.toBuffer()],
  program.programId
);
```

---

### 4.4 创建流动性池

```typescript
const sqrtPriceX64 = new BN("18446744073709551616"); // 2^64 = price 1:1
const openTime = new BN(0); // Already open

await program.methods
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
```

**输出:**
```
✅ 流动性池创建成功!
交易签名: 2bpM2f43fD1GFtbE5Zns3znWN7NimzjJsaQPbuMGSyimhBAManDaBhe4RDhgFZGgxnjCrqcgiMiEFDUNNkoWwCdN
```

---

## 创建结果

| 项目 | 值 |
|------|------|
| Pool State | `5tqavqdjJEsXBnwHHmiyaQWaZZDtKUfYwuA3Q1d466tD` |
| Token 0 | `5YBxwZ4JtcKFmYbY8zRfzhTyqjZ51nt9WXe6zb2gHNow` |
| Token 1 | `8djtxGXwWW6YQDu1DytLSA9XkKQv7b8yYh3GTVwvQ3mQ` |
| Token Vault 0 | `Chs9Z9ZZD7umUcBWCY2nNBHvcSZWtkt2SdRKzYD8WGp6` |
| Token Vault 1 | `CmSa6tKEcvdwdTbNRjkxcnBrAm2JgZXKRsDMAKJZq2gs` |
| Observation State | `J3WNtueBc7H9dhZ8ZKkcE7LZGNfDou1UMG6gsdd7NtUm` |
| Tick Array Bitmap | `5mBaoKQzyzRGVYDWvxrNgVgdQsEpsxKMKs6erEy4iDn9` |
| 初始价格 | 1:1 (sqrt_price = 2^64) |

---

## 初始价格说明

```
sqrt_price_x64 = 2^64 = 18446744073709551616

价格计算:
price = (sqrt_price_x64 / 2^64)^2
price = (2^64 / 2^64)^2
price = 1^2
price = 1

即 1 Token0 = 1 Token1
```

---

## 相关文件

- 创建脚本: `scripts/create-pool.ts`
- Pool 指令: `programs/amm/src/instructions/create_pool.rs`
