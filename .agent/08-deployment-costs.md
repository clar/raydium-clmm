# 08 - Raydium CLMM 部署费用明细

## 概述

部署 Raydium CLMM 涉及两类费用：
1. **租金押金 (Rent Deposit)** - 账户存储押金，可回收
2. **交易费 (Transaction Fee)** - 网络手续费，不可回收

---

## 一、程序部署费用

### 1.1 Program 账户

| 项目 | 值 |
|------|------|
| 账户地址 | `FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28` |
| 数据大小 | 1,248,976 bytes (~1.2 MB) |
| **租金押金** | **8.69407704 SOL** |
| 类型 | 可升级程序 |

### 1.2 IDL 账户

| 项目 | 值 |
|------|------|
| 账户地址 | `9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL` |
| 数据大小 | 21,856 bytes |
| **租金押金** | **0.15300864 SOL** |
| 类型 | IDL 存储 |

### 程序部署总费用

| 费用类型 | 金额 | 说明 |
|----------|------|------|
| Program 租金押金 | 8.69407704 SOL | 可通过 `solana program close` 回收 |
| IDL 租金押金 | 0.15300864 SOL | 可通过 `anchor idl close` 回收 |
| 部署交易费 | ~0.01 SOL | 多次交易累计，不可回收 |
| **小计** | **~8.86 SOL** | |

---

## 二、协议初始化费用

### 2.1 AmmConfig 账户

每创建一个费率配置：

| 项目 | 值 |
|------|------|
| 数据大小 | 117 bytes |
| **租金押金** | **0.0017052 SOL** |
| 交易费 | ~0.000005 SOL |
| 创建者 | Admin |

### 2.2 OperationState 账户 (可选)

| 项目 | 值 |
|------|------|
| 数据大小 | ~1000 bytes |
| **租金押金** | **~0.00785 SOL** |
| 交易费 | ~0.000005 SOL |

---

## 三、创建流动性池费用

每创建一个交易对池：

### 3.1 PoolState 账户

| 项目 | 值 |
|------|------|
| 数据大小 | 1,544 bytes |
| **租金押金** | **0.01163712 SOL** |

### 3.2 Token Vault 账户 (x2)

| 项目 | 值 |
|------|------|
| 数据大小 | 165 bytes × 2 |
| **租金押金** | **0.00407856 SOL** (每个 0.00203928) |

### 3.3 ObservationState 账户

| 项目 | 值 |
|------|------|
| 数据大小 | ~8,000+ bytes |
| **租金押金** | **~0.06 SOL** |

### 3.4 TickArrayBitmapExtension 账户

| 项目 | 值 |
|------|------|
| 数据大小 | ~1,800 bytes |
| **租金押金** | **~0.014 SOL** |

### 创建池总费用

| 费用类型 | 金额 | 可回收 |
|----------|------|--------|
| PoolState 押金 | 0.01163712 SOL | ❌ (池存在期间) |
| TokenVault0 押金 | 0.00203928 SOL | ❌ |
| TokenVault1 押金 | 0.00203928 SOL | ❌ |
| ObservationState 押金 | ~0.06 SOL | ❌ |
| TickArrayBitmap 押金 | ~0.014 SOL | ❌ |
| 交易费 | ~0.000005 SOL | ❌ |
| **小计** | **~0.09 SOL** | |

---

## 四、开仓 (Open Position) 费用

每开一个新仓位：

### 4.1 PersonalPositionState 账户

| 项目 | 值 |
|------|------|
| 数据大小 | 257 bytes |
| **租金押金** | **0.0026796 SOL** |

### 4.2 Position NFT Mint 账户

| 项目 | 值 |
|------|------|
| 数据大小 | 82 bytes (Token-2022) |
| **租金押金** | **~0.0015 SOL** |

### 4.3 Position NFT Token Account

| 项目 | 值 |
|------|------|
| 数据大小 | 165 bytes |
| **租金押金** | **0.00203928 SOL** |

### 4.4 TickArray 账户 (按需创建)

每个 TickArray 覆盖 60 个 tick：

| 项目 | 值 |
|------|------|
| 数据大小 | 10,244 bytes |
| **租金押金** | **0.07218912 SOL** |

**注意：** 根据仓位的 tick 范围，可能需要创建 1-N 个 TickArray。

### 开仓总费用

| 费用类型 | 金额 | 可回收 |
|----------|------|--------|
| PersonalPosition 押金 | 0.0026796 SOL | ✅ 关仓时回收 |
| NFT Mint 押金 | ~0.0015 SOL | ✅ 关仓时回收 |
| NFT Token Account 押金 | 0.00203928 SOL | ✅ 关仓时回收 |
| TickArray 押金 (每个) | 0.07218912 SOL | ❌ (池公共资源) |
| 交易费 | ~0.000005 SOL | ❌ |
| **小计 (不含 TickArray)** | **~0.006 SOL** | |
| **小计 (含 2 个 TickArray)** | **~0.15 SOL** | |

---

## 五、Swap 交易费用

每次 Swap：

| 费用类型 | 金额 | 说明 |
|----------|------|------|
| 交易费 (Tx Fee) | ~0.000005 SOL | 网络费，不可回收 |
| 交易费 (Trade Fee) | 输入金额 × fee_rate | 归 LP，不是押金 |
| 优先费 (Priority Fee) | 可选 | 加速交易 |

**Trade Fee 示例 (本 fork)：**
```
输入: 100 tokens
Trade Fee Rate: 0.25%
Trade Fee: 0.25 tokens → 100% 归 LP
Protocol Fee: 0 (fork 强制)
Fund Fee: 0 (fork 强制)
```

---

## 六、费用类型对比

### 押金 (Rent Deposit) - 可回收

| 账户 | 金额 | 回收时机 |
|------|------|----------|
| Program | 8.69 SOL | `solana program close` |
| IDL | 0.15 SOL | `anchor idl close` |
| PersonalPosition | 0.0027 SOL | `closePosition` |
| NFT Mint + Account | 0.0035 SOL | `closePosition` |

### 押金 (Rent Deposit) - 不可回收

| 账户 | 金额 | 原因 |
|------|------|------|
| PoolState | 0.0116 SOL | 池永久存在 |
| TokenVault x2 | 0.0041 SOL | 池永久存在 |
| ObservationState | 0.06 SOL | 池永久存在 |
| TickArray | 0.072 SOL/个 | 池公共资源 |
| AmmConfig | 0.0017 SOL | 协议配置 |

### 交易费 (Transaction Fee) - 不可回收

| 类型 | 金额 | 说明 |
|------|------|------|
| 基础交易费 | ~0.000005 SOL | 每笔交易 |
| 优先费 | 可变 | 可选，加速 |
| Compute Units | 可变 | 复杂指令消耗更多 |

---

## 七、完整部署成本估算

### 最小部署 (1 个 Config + 1 个 Pool)

| 项目 | 押金 | 交易费 | 合计 |
|------|------|--------|------|
| 程序部署 | 8.69 SOL | 0.01 SOL | 8.70 SOL |
| IDL 上传 | 0.15 SOL | 0.00001 SOL | 0.15 SOL |
| AmmConfig | 0.0017 SOL | 0.00001 SOL | 0.0017 SOL |
| Pool 创建 | 0.09 SOL | 0.00001 SOL | 0.09 SOL |
| **总计** | **8.93 SOL** | **~0.01 SOL** | **~8.94 SOL** |

### 开仓测试 (含 2 个 TickArray)

| 项目 | 押金 | 交易费 |
|------|------|--------|
| PersonalPosition | 0.0027 SOL | - |
| NFT Mint + Account | 0.0035 SOL | - |
| TickArray x2 | 0.1444 SOL | - |
| 交易费 | - | 0.00001 SOL |
| **总计** | **~0.15 SOL** | |

---

## 八、费用回收方法

### 关闭程序 (回收 ~8.69 SOL)
```bash
solana program close FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28 --bypass-warning
```

### 关闭 IDL (回收 ~0.15 SOL)
```bash
anchor idl close FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28 --provider.cluster devnet
```

### 关闭仓位 (回收 ~0.006 SOL)
调用 `closePosition` 指令，自动回收 PersonalPosition 和 NFT 账户租金。

---

## 总结

| 费用类别 | 典型金额 | 性质 |
|----------|----------|------|
| 程序部署 | ~8.85 SOL | 押金，可回收 |
| 协议初始化 | ~0.09 SOL | 押金，不可回收 |
| 每个仓位 | ~0.006 SOL | 押金，关仓回收 |
| 每个 TickArray | ~0.072 SOL | 押金，不可回收 |
| 每笔交易 | ~0.000005 SOL | 费用，不可回收 |
| Trade Fee | 0.25% | 归 LP，非押金 |
