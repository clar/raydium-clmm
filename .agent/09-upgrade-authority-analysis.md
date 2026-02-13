# 09 - Raydium CLMM 程序升级能力分析

## 一、当前状态

### Devnet 部署 (本 Fork)

```
Program Id: FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: 6J4YypNFdC9Dym2pLxUqWGkGdYetznPbWiLT5gA2MA89
Authority: 9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA  ← 可升级
```

### Mainnet Raydium CLMM (官方)

```
Program Id: CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: HzD2cCXXT3UQNjMMY6kDv9w6gZ9qquSdfoGXrLL3LXx
Authority: GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ  ← 可升级
```

**结论：** 两个程序都是**可升级**的 (有 Authority)。

---

## 二、Solana 程序升级机制

### 2.1 BPF Loader Upgradeable

Solana 使用 `BPFLoaderUpgradeab1e` 支持可升级程序：

```
┌─────────────────────────────────────────────────────────────┐
│                     Program Account                          │
│  Address: FNJHxG95...                                        │
│  Owner: BPFLoaderUpgradeab1e                                 │
│  Data: 指向 ProgramData 的地址                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   ProgramData Account                        │
│  Address: 6J4YypNF...                                        │
│  Authority: 9mvddFmG... (升级权限持有者)                      │
│  Data: 实际的程序字节码 (~1.2MB)                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Authority 权限

| Authority 状态 | 程序状态 | 说明 |
|----------------|----------|------|
| 有效 Pubkey | **可升级** | 持有者可随时更新程序代码 |
| None | **不可升级** | 程序永久锁定，无法修改 |

---

## 三、关闭升级能力的方法

### 方法 1: 使用 `--final` 标志 (推荐)

```bash
solana program set-upgrade-authority <PROGRAM_ADDRESS> --final
```

**示例 (Devnet)：**
```bash
solana program set-upgrade-authority FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28 \
  --final \
  --url devnet
```

### 方法 2: 设置 Authority 为无效地址

```bash
solana program set-upgrade-authority <PROGRAM_ADDRESS> \
  --new-upgrade-authority 11111111111111111111111111111111 \
  --skip-new-upgrade-authority-signer-check
```

**注意：** 方法 1 更安全，明确表示意图。

---

## 四、关闭升级能力的影响

### 4.1 正面影响

| 影响 | 说明 |
|------|------|
| **安全性提升** | 防止恶意升级、后门植入 |
| **信任增强** | 用户可验证代码永不改变 |
| **去中心化** | 消除单点控制风险 |
| **合规性** | 某些场景要求不可变代码 |
| **审计简化** | 一次审计永久有效 |

### 4.2 负面影响

| 影响 | 说明 | 严重程度 |
|------|------|----------|
| **无法修复 Bug** | 发现漏洞无法修补 | 🔴 高 |
| **无法添加功能** | 无法扩展新特性 | 🟡 中 |
| **无法优化** | 无法改进性能 | 🟡 中 |
| **操作不可逆** | 一旦设置无法恢复 | 🔴 高 |
| **资金风险** | 有漏洞时无法保护资金 | 🔴 高 |

### 4.3 风险矩阵

```
                    发现漏洞
                    ┌─────────────────────────────────────┐
                    │                                     │
   可升级程序 ──────▶│  升级修复 ──▶ 用户资金安全          │
                    │                                     │
                    └─────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │                                     │
  不可升级程序 ─────▶│  无法修复 ──▶ 可能需要迁移协议      │
                    │             ──▶ 用户资金可能受损     │
                    └─────────────────────────────────────┘
```

---

## 五、行业实践分析

### 5.1 主流协议的选择

| 协议 | 网络 | 可升级? | 策略 |
|------|------|---------|------|
| **Raydium CLMM** | Mainnet | ✅ 是 | 保留升级能力 |
| **Raydium AMM** | Mainnet | ✅ 是 | 保留升级能力 |
| **Orca Whirlpool** | Mainnet | ✅ 是 | 保留升级能力 |
| **Marinade** | Mainnet | ✅ 是 | 保留升级能力 |
| **Jupiter** | Mainnet | ✅ 是 | 保留升级能力 |
| **Serum DEX** | Mainnet | ❌ 否 | 不可升级 |

**观察：** 大多数主流 DeFi 协议选择**保留升级能力**。

### 5.2 为什么保留升级能力?

1. **Solana 生态快速迭代** - 需要适应网络升级
2. **安全响应** - 能够快速修复发现的漏洞
3. **功能演进** - 支持 Token-2022 等新标准
4. **成本考虑** - 避免频繁迁移协议的高成本

### 5.3 替代安全措施

即使保留升级能力，也可以增加安全措施：

| 措施 | 说明 |
|------|------|
| **多签控制** | 使用 Multisig 管理 Authority |
| **时间锁** | 升级前公示期 (如 48 小时) |
| **治理投票** | DAO 投票批准升级 |
| **审计要求** | 每次升级需审计报告 |
| **渐进式锁定** | 协议成熟后再锁定 |

---

## 六、针对本 Fork 的建议

### 6.1 开发/测试阶段 (当前)

```
建议: 保留升级能力
原因: 需要快速迭代修复问题
```

### 6.2 生产环境选项

#### 选项 A: 保留升级能力 + 多签

```
┌─────────────────────────────────────────┐
│  Upgrade Authority                       │
│  ↓                                       │
│  Multisig (如 Squads)                    │
│  - 需要 3/5 签名                          │
│  - 48 小时时间锁                          │
└─────────────────────────────────────────┘
```

**优点：** 灵活 + 安全
**缺点：** 需要信任多签成员

#### 选项 B: 锁定程序 (不可升级)

```bash
solana program set-upgrade-authority \
  FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28 \
  --final \
  --url devnet
```

**优点：** 完全去中心化、无需信任
**缺点：** 无法修复任何问题

#### 选项 C: 延迟锁定

```
阶段 1 (0-6 月): 保留升级能力，快速修复
阶段 2 (6-12 月): 转移到多签
阶段 3 (12+ 月): 社区投票决定是否锁定
```

**优点：** 平衡安全和灵活性
**缺点：** 需要长期规划

---

## 七、技术操作步骤

### 7.1 检查当前状态

```bash
solana program show <PROGRAM_ADDRESS> --url <CLUSTER>
```

### 7.2 转移 Authority 到多签

```bash
# 创建 Squads 多签后
solana program set-upgrade-authority <PROGRAM_ADDRESS> \
  --new-upgrade-authority <MULTISIG_ADDRESS> \
  --url devnet
```

### 7.3 永久锁定程序

```bash
# ⚠️ 不可逆操作！
solana program set-upgrade-authority <PROGRAM_ADDRESS> \
  --final \
  --url devnet
```

### 7.4 验证锁定状态

```bash
solana program show <PROGRAM_ADDRESS> --url devnet
# Authority 应显示为 "none"
```

---

## 八、锁定后的应急方案

如果程序被锁定后发现严重漏洞：

### 8.1 协议迁移

```
1. 部署新版本程序 (新地址)
2. 暂停旧程序 (如果有暂停功能)
3. 引导用户迁移资金
4. 逐步废弃旧程序
```

### 8.2 本 Fork 的暂停能力

查看 `PoolState.status` 字段：

```rust
// 可以暂停特定功能
pub status: u8,
// bit0: 禁止开仓/加流动性
// bit1: 禁止减流动性
// bit2: 禁止收费
// bit3: 禁止收奖励
// bit4: 禁止 Swap
```

**注意：** 暂停功能由 `updatePoolStatus` 指令控制，需要 Admin 权限。

---

## 九、总结

| 方面 | 可升级 | 不可升级 |
|------|--------|----------|
| 安全漏洞响应 | ✅ 可修复 | ❌ 无法修复 |
| 功能迭代 | ✅ 可添加 | ❌ 永久锁定 |
| 用户信任 | 🟡 需要信任团队 | ✅ 无需信任 |
| 去中心化 | 🟡 中心化控制点 | ✅ 完全去中心化 |
| 操作灵活性 | ✅ 高 | ❌ 无 |
| 适合阶段 | 开发/早期生产 | 成熟协议 |

### 建议决策流程

```
1. 开发测试阶段 → 保留升级能力
2. 生产初期 → 转移到多签 + 时间锁
3. 协议成熟 → 社区投票决定是否永久锁定
```

---

## 相关命令参考

```bash
# 查看程序状态
solana program show <PROGRAM_ID> --url <CLUSTER>

# 转移升级权限
solana program set-upgrade-authority <PROGRAM_ID> \
  --new-upgrade-authority <NEW_AUTHORITY>

# 永久锁定 (不可逆)
solana program set-upgrade-authority <PROGRAM_ID> --final

# 升级程序
solana program deploy target/deploy/amm_v3.so \
  --program-id <PROGRAM_ID> \
  --upgrade-authority <KEYPAIR>

# 关闭程序 (回收租金，需要 Authority)
solana program close <PROGRAM_ID>
```
