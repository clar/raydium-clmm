# 03 - Fork 行为验证测试

## 目标

验证 fork 后的 CLMM 在链上强制执行零 protocol/fund fee。

## Fork 修改说明

在 `programs/amm/src/instructions/admin/create_amm_config.rs` 中添加了以下检查:

```rust
require_eq!(
    protocol_fee_rate,
    0,
    ErrorCode::NonZeroProtocolOrFundFeeNotAllowed
);
require_eq!(
    fund_fee_rate,
    0,
    ErrorCode::NonZeroProtocolOrFundFeeNotAllowed
);
```

这确保创建 AmmConfig 时 `protocol_fee_rate` 和 `fund_fee_rate` 必须为 0。

---

## 测试步骤

### 3.1 创建 AmmConfig (零费率) - 应成功

```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
pnpm tsx scripts/create-amm-config.ts
```

**脚本参数:**
```typescript
createAmmConfig(
  index: 0,
  tickSpacing: 60,
  tradeFeeRate: 2500,    // 0.25%
  protocolFeeRate: 0,    // 必须为 0
  fundFeeRate: 0         // 必须为 0
)
```

**输出:**
```
AmmConfig created: GkbFNrEJebunoSCniGGa3nPV2DDA8AdrPg6kZm7ExHqZ
```

**状态:** ✅ 成功创建

---

### 3.2 测试 protocol_fee_rate != 0 - 应失败

**测试脚本:** `scripts/test-fork-behavior.ts`

**测试参数:**
```typescript
createAmmConfig(
  index: 1,
  tickSpacing: 60,
  tradeFeeRate: 2500,
  protocolFeeRate: 100,  // 非零!
  fundFeeRate: 0
)
```

**预期:** 交易失败，错误码 `NonZeroProtocolOrFundFeeNotAllowed`

**实际输出:**
```
测试 1: protocol_fee_rate != 0 应失败
✅ 成功: 正确拒绝了非零 protocol_fee_rate
```

**状态:** ✅ 正确拒绝

---

### 3.3 测试 fund_fee_rate != 0 - 应失败

**测试参数:**
```typescript
createAmmConfig(
  index: 2,
  tickSpacing: 60,
  tradeFeeRate: 2500,
  protocolFeeRate: 0,
  fundFeeRate: 100       // 非零!
)
```

**预期:** 交易失败，错误码 `NonZeroProtocolOrFundFeeNotAllowed`

**实际输出:**
```
测试 2: fund_fee_rate != 0 应失败
✅ 成功: 正确拒绝了非零 fund_fee_rate
```

**状态:** ✅ 正确拒绝

---

### 3.4 测试 both == 0 - 应成功

**测试参数:**
```typescript
createAmmConfig(
  index: 3,
  tickSpacing: 60,
  tradeFeeRate: 2500,
  protocolFeeRate: 0,    // 零
  fundFeeRate: 0         // 零
)
```

**预期:** 交易成功

**实际输出:**
```
测试 3: protocol_fee_rate == 0 且 fund_fee_rate == 0 应成功
✅ 成功: AmmConfig 创建成功: 24EzJ1FwYr1iFWBrWH1kZzDPyaokmHQPTdZ4uShnSLJ4
```

**状态:** ✅ 成功创建

---

## 完整测试输出

```
=== Raydium CLMM Fork 行为验证 ===

测试 1: protocol_fee_rate != 0 应失败
✅ 成功: 正确拒绝了非零 protocol_fee_rate

测试 2: fund_fee_rate != 0 应失败
✅ 成功: 正确拒绝了非零 fund_fee_rate

测试 3: protocol_fee_rate == 0 且 fund_fee_rate == 0 应成功
✅ 成功: AmmConfig 创建成功: 24EzJ1FwYr1iFWBrWH1kZzDPyaokmHQPTdZ4uShnSLJ4

=== 验证完成 ===
```

---

## 测试总结

| 测试场景 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|------|
| `protocol_fee_rate = 100, fund_fee_rate = 0` | 失败 | 失败 (NonZeroProtocolOrFundFeeNotAllowed) | ✅ |
| `protocol_fee_rate = 0, fund_fee_rate = 100` | 失败 | 失败 (NonZeroProtocolOrFundFeeNotAllowed) | ✅ |
| `protocol_fee_rate = 0, fund_fee_rate = 0` | 成功 | 成功 | ✅ |

## 创建的 AmmConfig

| Index | 地址 | 状态 |
|-------|------|------|
| 0 | `GkbFNrEJebunoSCniGGa3nPV2DDA8AdrPg6kZm7ExHqZ` | ✅ 有效 |
| 3 | `24EzJ1FwYr1iFWBrWH1kZzDPyaokmHQPTdZ4uShnSLJ4` | ✅ 有效 |

## 相关文件

- 测试脚本: `scripts/test-fork-behavior.ts`
- Fork 修改: `programs/amm/src/instructions/admin/create_amm_config.rs`
- 参考文档: `fork.md` 第 8 节
