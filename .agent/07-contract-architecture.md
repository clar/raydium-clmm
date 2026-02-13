# 07 - Raydium CLMM 合约架构

## 概述

Raydium CLMM (Concentrated Liquidity Market Maker) 是一个基于 Solana 的集中流动性 AMM 协议，类似于 Uniswap V3。

---

## 程序信息

| 项目 | 值 |
|------|------|
| Program ID | `FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28` |
| IDL Account | `9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL` |
| Network | Solana Devnet |

**Solscan:**
- [Program](https://solscan.io/account/FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28?cluster=devnet)
- [IDL](https://solscan.io/account/9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL?cluster=devnet)

---

## 账户结构 (States)

### 1. AmmConfig

**用途:** 存储 AMM 协议配置，包括费率和 tick spacing。

**PDA Seeds:** `["amm_config", index.to_be_bytes()]`

```rust
pub struct AmmConfig {
    pub bump: u8,
    pub index: u16,
    pub owner: Pubkey,              // 协议所有者
    pub protocol_fee_rate: u32,     // 协议费率 (fork 强制为 0)
    pub trade_fee_rate: u32,        // 交易费率 (如 2500 = 0.25%)
    pub tick_spacing: u16,          // tick 间隔
    pub fund_fee_rate: u32,         // 基金费率 (fork 强制为 0)
    pub fund_owner: Pubkey,         // 基金所有者
}
```

**大小:** ~117 bytes

---

### 2. PoolState

**用途:** 存储流动性池的完整状态。

**PDA Seeds:** `["pool", amm_config, token_mint_0, token_mint_1]`

```rust
pub struct PoolState {
    pub bump: [u8; 1],
    pub amm_config: Pubkey,         // 关联的 AmmConfig
    pub owner: Pubkey,              // 池创建者
    pub token_mint_0: Pubkey,       // Token 0 Mint (地址较小)
    pub token_mint_1: Pubkey,       // Token 1 Mint (地址较大)
    pub token_vault_0: Pubkey,      // Token 0 金库
    pub token_vault_1: Pubkey,      // Token 1 金库
    pub observation_key: Pubkey,    // Oracle 观察账户
    pub mint_decimals_0: u8,
    pub mint_decimals_1: u8,
    pub tick_spacing: u16,
    pub liquidity: u128,            // 当前活跃流动性
    pub sqrt_price_x64: u128,       // 当前价格 (Q64.64)
    pub tick_current: i32,          // 当前 tick
    pub fee_growth_global_0_x64: u128,
    pub fee_growth_global_1_x64: u128,
    pub protocol_fees_token_0: u64,
    pub protocol_fees_token_1: u64,
    pub status: u8,                 // 池状态位
    pub reward_infos: [RewardInfo; 3], // 奖励信息
    pub tick_array_bitmap: [u64; 16],  // tick array 位图
    // ... 更多字段
}
```

**大小:** ~1544 bytes

---

### 3. PersonalPositionState

**用途:** 存储用户的 LP 仓位信息。

**PDA Seeds:** `["position", nft_mint]`

```rust
pub struct PersonalPositionState {
    pub bump: [u8; 1],
    pub nft_mint: Pubkey,           // 仓位 NFT Mint
    pub pool_id: Pubkey,            // 关联的池
    pub tick_lower_index: i32,      // 仓位下边界
    pub tick_upper_index: i32,      // 仓位上边界
    pub liquidity: u128,            // 仓位流动性
    pub fee_growth_inside_0_last_x64: u128,
    pub fee_growth_inside_1_last_x64: u128,
    pub token_fees_owed_0: u64,     // 待领取费用
    pub token_fees_owed_1: u64,
    pub reward_infos: [PositionRewardInfo; 3],
}
```

**大小:** ~257 bytes

---

### 4. TickArrayState

**用途:** 存储 tick 数据数组，每个数组包含 60 个 tick。

**PDA Seeds:** `["tick_array", pool_id, start_tick_index.to_be_bytes()]`

```rust
pub struct TickArrayState {
    pub pool_id: Pubkey,
    pub start_tick_index: i32,
    pub ticks: [TickState; 60],     // 60 个 tick
    pub initialized_tick_count: u8,
}

pub struct TickState {
    pub tick: i32,
    pub liquidity_net: i128,        // 流动性变化
    pub liquidity_gross: u128,      // 总流动性
    pub fee_growth_outside_0_x64: u128,
    pub fee_growth_outside_1_x64: u128,
    pub reward_growths_outside_x64: [u128; 3],
}
```

**大小:** ~10244 bytes

---

### 5. TickArrayBitmapExtension

**用途:** 扩展的 tick array 位图，用于大范围价格。

**PDA Seeds:** `["pool_tick_array_bitmap_extension", pool_id]`

---

### 6. ObservationState

**用途:** 存储价格观察数据 (Oracle)。

**PDA Seeds:** `["observation", pool_id]`

---

### 7. OperationState

**用途:** 存储操作权限和白名单。

---

## 指令 (Instructions)

### Admin 指令

| 指令 | 说明 | 权限 |
|------|------|------|
| `createAmmConfig` | 创建 AMM 配置 | Admin |
| `updateAmmConfig` | 更新 AMM 配置 | Owner |
| `createOperationAccount` | 创建操作账户 | Admin |
| `updateOperationAccount` | 更新操作账户 | Admin |
| `updatePoolStatus` | 更新池状态 | Owner |
| `collectProtocolFee` | 收取协议费 | Owner |
| `collectFundFee` | 收取基金费 | FundOwner |

### Pool 指令

| 指令 | 说明 |
|------|------|
| `createPool` | 创建流动性池 |

### Position 指令

| 指令 | 说明 |
|------|------|
| `openPosition` | 开仓 (旧版) |
| `openPositionV2` | 开仓 (支持 Token-2022) |
| `openPositionWithToken22Nft` | 开仓 (Token-2022 NFT) |
| `closePosition` | 关闭仓位 |
| `increaseLiquidity` | 增加流动性 (旧版) |
| `increaseLiquidityV2` | 增加流动性 (支持 Token-2022) |
| `decreaseLiquidity` | 减少流动性 (旧版) |
| `decreaseLiquidityV2` | 减少流动性 (支持 Token-2022) |

### Swap 指令

| 指令 | 说明 |
|------|------|
| `swap` | 交换 (旧版) |
| `swapV2` | 交换 (支持 Token-2022) |
| `swapRouterBaseIn` | 路由交换 |

### Reward 指令

| 指令 | 说明 |
|------|------|
| `initializeReward` | 初始化奖励 |
| `setRewardParams` | 设置奖励参数 |
| `collectRemainingRewards` | 收取剩余奖励 |
| `updateRewardInfos` | 更新奖励信息 |

---

## 交互流程

### 1. 创建池流程

```
Admin                          Program
  │                               │
  ├─── createAmmConfig ──────────>│  (创建费率配置)
  │                               │
  │    AmmConfig PDA created      │
  │<──────────────────────────────┤
  │                               │
User                              │
  │                               │
  ├─── createPool ───────────────>│  (创建交易对)
  │                               │
  │    PoolState PDA created      │
  │    TokenVault0 created        │
  │    TokenVault1 created        │
  │    ObservationState created   │
  │    TickArrayBitmap created    │
  │<──────────────────────────────┤
```

### 2. 添加流动性流程

```
User                              Program
  │                               │
  ├─── openPositionWithToken22Nft>│
  │    (tick_lower, tick_upper,   │
  │     liquidity, amounts)       │
  │                               │
  │    Create NFT Mint            │
  │    Create PersonalPosition    │
  │    Initialize TickArrays      │
  │    Transfer tokens to vault   │
  │<──────────────────────────────┤
  │                               │
  ├─── increaseLiquidityV2 ──────>│  (增加更多流动性)
  │                               │
```

### 3. Swap 流程

```
User                              Program
  │                               │
  ├─── swapV2 ───────────────────>│
  │    (amount, min_out,          │
  │     sqrt_price_limit,         │
  │     is_base_input)            │
  │                               │
  │    Calculate swap amounts     │
  │    Cross ticks if needed      │
  │    Update pool state          │
  │    Transfer tokens            │
  │<──────────────────────────────┤
```

---

## PDA 地址推导

```typescript
// AmmConfig
const [ammConfig] = PublicKey.findProgramAddressSync(
  [Buffer.from("amm_config"), index.toArrayLike(Buffer, "be", 2)],
  programId
);

// PoolState
const [poolState] = PublicKey.findProgramAddressSync(
  [Buffer.from("pool"), ammConfig.toBuffer(), tokenMint0.toBuffer(), tokenMint1.toBuffer()],
  programId
);

// TokenVault
const [tokenVault0] = PublicKey.findProgramAddressSync(
  [Buffer.from("pool_vault"), poolState.toBuffer(), tokenMint0.toBuffer()],
  programId
);

// PersonalPosition
const [personalPosition] = PublicKey.findProgramAddressSync(
  [Buffer.from("position"), nftMint.toBuffer()],
  programId
);

// TickArray
const [tickArray] = PublicKey.findProgramAddressSync(
  [Buffer.from("tick_array"), poolState.toBuffer(), startTickIndex.toBeBytes()],
  programId
);

// ObservationState
const [observationState] = PublicKey.findProgramAddressSync(
  [Buffer.from("observation"), poolState.toBuffer()],
  programId
);

// TickArrayBitmapExtension
const [tickArrayBitmap] = PublicKey.findProgramAddressSync(
  [Buffer.from("pool_tick_array_bitmap_extension"), poolState.toBuffer()],
  programId
);
```

---

## Fork 修改说明

本 fork 在 `create_amm_config.rs` 中添加了以下强制检查：

```rust
require_eq!(protocol_fee_rate, 0, ErrorCode::NonZeroProtocolOrFundFeeNotAllowed);
require_eq!(fund_fee_rate, 0, ErrorCode::NonZeroProtocolOrFundFeeNotAllowed);
```

这确保：
- **Protocol Fee = 0%** - 无协议抽成
- **Fund Fee = 0%** - 无基金抽成
- **所有交易费用归 LP**

---

## 费用模型

```
Trade Fee Rate = 2500 / 1,000,000 = 0.25%

每笔交易:
  输入金额: 100 tokens
  交易费用: 100 × 0.25% = 0.25 tokens
  
费用分配 (Fork 后):
  - Protocol Fee: 0% (强制)
  - Fund Fee: 0% (强制)
  - LP Fee: 100% (0.25 tokens 全部归 LP)
```

---

## 账户数据解析

### 问题：Solscan 在 Devnet 无法显示 Account Data

**原因：** Solscan 对 devnet 上的自定义程序 IDL 解析支持有限。主网上的 Raydium CLMM 程序 (`CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`) 已被 Solscan 官方收录，因此可以解析显示 accountData。

### 解决方案：使用本地解析脚本

运行以下命令解析任意池子账户：

```bash
npx ts-node scripts/decode-pool.ts <pool_address>

# 示例
npx ts-node scripts/decode-pool.ts 83UYZwtd7Bs4iVxNtNBoT5D52YMB6rk2ShYGhEfMHkdP
```

### 测试池子解析结果

```
============================================================
PoolState Account Data
============================================================

--- Basic Info ---
AMM Config: GkbFNrEJebunoSCniGGa3nPV2DDA8AdrPg6kZm7ExHqZ
Owner: 9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA
Token Mint 0: 2hPgCtUpVEUsQLQNW2jGuAC5HcFeAR95WAz2CVoKU6T9
Token Mint 1: 5qMLECHTMWXcEfXXbHLuD2NXv1hKaGdrwX1mq7bvmVob
Token Vault 0: 7a97b4MwefMY8vJX59qKzh3adSUpZ82Df7xXhG9o9Nx3
Token Vault 1: 8wGzDj77UHoCSd1M6CM89sAJe22UxFBMZCMmPJM3C4TD

--- Token Decimals ---
Mint 0 Decimals: 9
Mint 1 Decimals: 9

--- Price & Liquidity ---
Tick Spacing: 60
Current Tick: -22
Liquidity: 10000000000
Sqrt Price X64: 18426525568529482642
Calculated Price (token1/token0): 0.9978091066

--- Fee Growth ---
Fee Growth Global 0 X64: 50728546202700
Fee Growth Global 1 X64: 0

--- Protocol Fees ---
Protocol Fees Token 0: 0
Protocol Fees Token 1: 0

--- Swap Amounts ---
Swap In Amount Token 0: 11000000
Swap Out Amount Token 1: 10960473
Swap In Amount Token 1: 0
Swap Out Amount Token 0: 0

--- Total Fees ---
Total Fees Token 0: 27500
Total Fees Claimed Token 0: 0
Total Fees Token 1: 0
Total Fees Claimed Token 1: 0

--- Fund Fees ---
Fund Fees Token 0: 0 (fork 强制)
Fund Fees Token 1: 0 (fork 强制)

============================================================
AmmConfig Account Data
============================================================

Index: 0
Owner: 9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA
Trade Fee Rate: 2500 (0.25%)
Protocol Fee Rate: 0 (0.00%) ← fork 强制
Fund Fee Rate: 0 (0.00%) ← fork 强制
Tick Spacing: 60
```

### 替代方案

1. **使用 Anchor CLI 解析**
   ```bash
   anchor account amm_v3.PoolState 83UYZwtd7Bs4iVxNtNBoT5D52YMB6rk2ShYGhEfMHkdP --provider.cluster devnet
   ```

2. **使用 Solana Explorer** (支持 devnet IDL)
   ```
   https://explorer.solana.com/address/83UYZwtd7Bs4iVxNtNBoT5D52YMB6rk2ShYGhEfMHkdP?cluster=devnet
   ```

---

## 测试池子信息

| 项目 | 值 |
|------|------|
| Pool Address | `83UYZwtd7Bs4iVxNtNBoT5D52YMB6rk2ShYGhEfMHkdP` |
| AmmConfig | `GkbFNrEJebunoSCniGGa3nPV2DDA8AdrPg6kZm7ExHqZ` |
| Token 0 | `2hPgCtUpVEUsQLQNW2jGuAC5HcFeAR95WAz2CVoKU6T9` |
| Token 1 | `5qMLECHTMWXcEfXXbHLuD2NXv1hKaGdrwX1mq7bvmVob` |
| Trade Fee | 0.25% |
| Protocol Fee | 0% (fork 强制) |
| Fund Fee | 0% (fork 强制) |

---

## 相关文件

| 类型 | 路径 |
|------|------|
| 程序入口 | `programs/amm/src/lib.rs` |
| 状态定义 | `programs/amm/src/states/` |
| 指令实现 | `programs/amm/src/instructions/` |
| 数学库 | `programs/amm/src/libraries/` |
| IDL 文件 | `target/idl/amm_v3.json` |
| TypeScript 类型 | `target/types/amm_v3.ts` |
| 池子解析脚本 | `scripts/decode-pool.ts` |
