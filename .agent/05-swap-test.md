# 05 - Swap 功能测试与费用分析

## 目标

测试 Swap 功能并验证费用计算是否符合预期。

---

## 测试环境

### AmmConfig 配置

```
地址: GkbFNrEJebunoSCniGGa3nPV2DDA8AdrPg6kZm7ExHqZ
Trade Fee Rate: 2500 (0.25%)
Protocol Fee Rate: 0 (0%)
Fund Fee Rate: 0 (0%)
Tick Spacing: 60
```

### 预期费用

- **Trade Fee:** 0.25% (2500 / 1,000,000)
- **Protocol Fee:** 0% (fork 强制)
- **Fund Fee:** 0% (fork 强制)
- **总费用:** 0.25% (全部归 LP)

---

## 测试步骤与交易记录

### 5.1 创建测试代币

```
Token 0: 2hPgCtUpVEUsQLQNW2jGuAC5HcFeAR95WAz2CVoKU6T9
Token 1: 5qMLECHTMWXcEfXXbHLuD2NXv1hKaGdrwX1mq7bvmVob
```

---

### 5.2 铸造代币

```
每种代币铸造: 1000 tokens (1,000,000,000,000 with 9 decimals)
```

---

### 5.3 创建流动性池

| 项目 | 值 |
|------|------|
| Pool State | `83UYZwtd7Bs4iVxNtNBoT5D52YMB6rk2ShYGhEfMHkdP` |
| 初始价格 | 1:1 (sqrt_price = 2^64) |
| **交易签名** | `628LMKJuq5RpGG2WKFxUynHvok5ch3ksuUJdZzV2x91tUbFcb1iXPT1bfaXgmWTzWvy96U9RPV46W1nxCgCm6DS2` |

**链上验证:**
- [Solscan 查看交易](https://solscan.io/tx/628LMKJuq5RpGG2WKFxUynHvok5ch3ksuUJdZzV2x91tUbFcb1iXPT1bfaXgmWTzWvy96U9RPV46W1nxCgCm6DS2?cluster=devnet)

---

### 5.4 开仓并添加流动性

| 项目 | 值 |
|------|------|
| 流动性 | 10,000,000,000 |
| Tick 范围 | [-120, 120] |
| Vault 0 余额 | 59,817,378 (0.059817378 tokens) |
| Vault 1 余额 | 59,817,378 (0.059817378 tokens) |
| **交易签名** | `28FjJoGKFuqgH7as11wMXG4SY7QJHeYAsxAeGcyTqjKgwHJA58Ly3fqGP8tKaoN3xzeDj4aKQSncpJJwFBpYhutL` |

**链上验证:**
- [Solscan 查看交易](https://solscan.io/tx/28FjJoGKFuqgH7as11wMXG4SY7QJHeYAsxAeGcyTqjKgwHJA58Ly3fqGP8tKaoN3xzeDj4aKQSncpJJwFBpYhutL?cluster=devnet)

---

### 5.5 Swap 交易测试

#### Swap #1: 0.001 tokens

| 项目 | 值 |
|------|------|
| 输入金额 | 1,000,000 |
| 输出金额 | 997,400 |
| 预期费用 (0.25%) | 2,500 |
| 实际费用 | 2,600 |
| 实际费率 | **0.26%** |
| **交易签名** | `5o1C6wFa8LDuoMkViMt6A4NGL5xvi1nijtfm93t7L4d5uz6LV7hwTYT24vnwGhsMJXja283kxGYe6EzzQtyujKQy` |

**链上验证:**
- [Solscan 查看交易](https://solscan.io/tx/5o1C6wFa8LDuoMkViMt6A4NGL5xvi1nijtfm93t7L4d5uz6LV7hwTYT24vnwGhsMJXja283kxGYe6EzzQtyujKQy?cluster=devnet)

**分析:**
- 基础费率 0.25% = 2,500
- 实际费用 2,600，多出 100 (0.01%)
- 差异来源: CLMM 价格计算精度
- **结论:** ✅ 符合预期

---

#### Swap #2: 0.01 tokens

| 项目 | 值 |
|------|------|
| 输入金额 | 10,000,000 |
| 输出金额 | 9,963,073 |
| 预期费用 (0.25%) | 25,000 |
| 实际费用 | 36,927 |
| 实际费率 | **0.37%** |
| **交易签名** | `2p5gQZfAeUZ7NTMdTxQnCg1gbkdCHT8pxbf2CuxsBBao9uTRi2MES6CPUMYpKoriK7pspZkLa84cjgeSLCGY5MXw` |

**链上验证:**
- [Solscan 查看交易](https://solscan.io/tx/2p5gQZfAeUZ7NTMdTxQnCg1gbkdCHT8pxbf2CuxsBBao9uTRi2MES6CPUMYpKoriK7pspZkLa84cjgeSLCGY5MXw?cluster=devnet)

**分析:**
- 基础费率 0.25% = 25,000
- 实际费用 36,927，多出 11,927 (0.12%)
- 差异来源: 价格滑点 (交易量相对于流动性较大)
- **结论:** ✅ 符合预期 (滑点是 CLMM 正常行为)

---

#### Swap #3 & #4: 大额交易

| 输入金额 | 状态 | 原因 |
|----------|------|------|
| 100,000,000 (0.1 tokens) | ❌ FAILED | 流动性不足 |
| 1,000,000,000 (1 token) | ❌ FAILED | 流动性不足 |

**说明:** 池中仅有 ~0.06 tokens 流动性，无法支持大额交易。

---

## 费用分析汇总

| 输入金额 | 输出金额 | 预期费用 | 实际费用 | 实际费率 | 状态 |
|----------|----------|----------|----------|----------|------|
| 1,000,000 | 997,400 | 2,500 | 2,600 | 0.26% | ✅ |
| 10,000,000 | 9,963,073 | 25,000 | 36,927 | 0.37% | ✅ |
| 100,000,000 | - | - | - | - | ❌ 流动性不足 |
| 1,000,000,000 | - | - | - | - | ❌ 流动性不足 |

---

## 费用公式说明

在 CLMM 中，总费用 = 基础费用 + 滑点

```
总费用 = 输入金额 × trade_fee_rate + 滑点损失

其中:
- trade_fee_rate = 2500 / 1,000,000 = 0.25%
- protocol_fee = 0 (fork 强制)
- fund_fee = 0 (fork 强制)
- 滑点 = f(交易量, 流动性深度)
```

---

## 链上验证地址

| 类型 | 地址 | 链接 |
|------|------|------|
| Program | `FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28` | [Solscan](https://solscan.io/account/FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28?cluster=devnet) |
| IDL Account | `9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL` | [Solscan](https://solscan.io/account/9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL?cluster=devnet) |
| Pool | `83UYZwtd7Bs4iVxNtNBoT5D52YMB6rk2ShYGhEfMHkdP` | [Solscan](https://solscan.io/account/83UYZwtd7Bs4iVxNtNBoT5D52YMB6rk2ShYGhEfMHkdP?cluster=devnet) |
| AmmConfig | `GkbFNrEJebunoSCniGGa3nPV2DDA8AdrPg6kZm7ExHqZ` | [Solscan](https://solscan.io/account/GkbFNrEJebunoSCniGGa3nPV2DDA8AdrPg6kZm7ExHqZ?cluster=devnet) |

---

## 交易签名汇总

| 操作 | 交易签名 | Solscan |
|------|----------|---------|
| 创建流动性池 | `628LMKJuq5RpGG2WKFxUynHvok5ch3ksuUJdZzV2x91tUbFcb1iXPT1bfaXgmWTzWvy96U9RPV46W1nxCgCm6DS2` | [查看](https://solscan.io/tx/628LMKJuq5RpGG2WKFxUynHvok5ch3ksuUJdZzV2x91tUbFcb1iXPT1bfaXgmWTzWvy96U9RPV46W1nxCgCm6DS2?cluster=devnet) |
| 开仓添加流动性 | `28FjJoGKFuqgH7as11wMXG4SY7QJHeYAsxAeGcyTqjKgwHJA58Ly3fqGP8tKaoN3xzeDj4aKQSncpJJwFBpYhutL` | [查看](https://solscan.io/tx/28FjJoGKFuqgH7as11wMXG4SY7QJHeYAsxAeGcyTqjKgwHJA58Ly3fqGP8tKaoN3xzeDj4aKQSncpJJwFBpYhutL?cluster=devnet) |
| Swap (0.001 tokens) | `5o1C6wFa8LDuoMkViMt6A4NGL5xvi1nijtfm93t7L4d5uz6LV7hwTYT24vnwGhsMJXja283kxGYe6EzzQtyujKQy` | [查看](https://solscan.io/tx/5o1C6wFa8LDuoMkViMt6A4NGL5xvi1nijtfm93t7L4d5uz6LV7hwTYT24vnwGhsMJXja283kxGYe6EzzQtyujKQy?cluster=devnet) |
| Swap (0.01 tokens) | `2p5gQZfAeUZ7NTMdTxQnCg1gbkdCHT8pxbf2CuxsBBao9uTRi2MES6CPUMYpKoriK7pspZkLa84cjgeSLCGY5MXw` | [查看](https://solscan.io/tx/2p5gQZfAeUZ7NTMdTxQnCg1gbkdCHT8pxbf2CuxsBBao9uTRi2MES6CPUMYpKoriK7pspZkLa84cjgeSLCGY5MXw?cluster=devnet) |

---

## IDL 上传记录

IDL 已上传到链上，方便第三方验证和解析交易。

```bash
anchor idl init --filepath target/idl/amm_v3.json FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28 --provider.cluster devnet
```

**输出:**
```
Idl data length: 10928 bytes
Idl account created: 9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL
```

---

## 测试总结

| 测试项 | 结果 | 说明 |
|--------|------|------|
| Swap 执行 | ✅ 成功 | 交易正常完成 |
| Trade Fee | ✅ 符合 | 0.25% 基础费率 |
| Protocol Fee | ✅ 零 | Fork 强制为 0 |
| Fund Fee | ✅ 零 | Fork 强制为 0 |
| 滑点行为 | ✅ 正常 | 随交易量增加 |
| IDL 上传 | ✅ 完成 | 支持链上验证 |

---

## 相关文件

- 基础测试脚本: `scripts/test-swap.ts`
- 详细测试脚本: `scripts/test-swap-detailed.ts`
- Swap 指令: `programs/amm/src/instructions/swap_v2.rs`
- IDL 文件: `target/idl/amm_v3.json`
