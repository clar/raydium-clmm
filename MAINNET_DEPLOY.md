# Mainnet Deployment Report

> Raydium CLMM Fork — Zero Protocol/Fund Fees
> Deployed: 2026-03-04 | Updated: 2026-03-05

---

## 1. Program

| Item | Value |
|------|-------|
| Program ID | `CftvdSTmVaaXg4YGKhuCCWo2uPhd9RTY35JyyKqadXnX` |
| Deploy TX | `5Yb7Ygx2ADWe7ZmDKAUEo2NzVfSeCThUkNG7pYJdLwnCKBKQKyMPb3gQYCKZwgwCoX3VCpApgygachnMzkmU2P2d` |
| IDL Account | `5eXGUyeWPmfG7CMuCsKaJiPbYBKSetELeKDKTYsBLRcC` |
| Upgrade Authority | `9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA` |
| Source Code | `release/zero-fees` branch |
| Code Verify | Pending（需要 Rust > 1.82.0 才能安装 `solana-verify`） |

**核心修改**：所有交易手续费 (0.25%) 100% 归 LP，protocol_fee 和 fund_fee 被硬编码为 0。

Solscan: https://solscan.io/account/CftvdSTmVaaXg4YGKhuCCWo2uPhd9RTY35JyyKqadXnX

---

## 2. TSLAx Whitelist

TSLAx 使用 Token-2022 标准且带有 freeze extension，需要先创建白名单才能建池。

| Item | Value |
|------|-------|
| TSLAx Mint | `XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB` (8 decimals, Token-2022) |
| USDC Mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (6 decimals, SPL Token) |
| Support Mint PDA | `5jhBEZjBoP3h4ZNMyseMxdRranNAhtt7rftkkKtB6vdf` |
| TX | `2wvrJTR8tJkq5KnXyA6K9kUwaxhxo2oyczgAEAXq2bUqHWVS7TLietLJjUq9eERGgqZnW868mUgFUEJYB5d4cCFg` |

---

## 3. 当前活跃池子 ✅

### AmmConfig (index=1)

| Item | Value |
|------|-------|
| Address | `DCYTDLDRTb6nwmRsqFUeNEvZrVXNryKA7SB8dCNQWwhP` |
| Tick Spacing | 60 |
| Trade Fee Rate | 2500 (0.25%) |
| Protocol Fee Rate | 0 |
| Fund Fee Rate | 0 |
| Create TX | `5ASyvYnFhGgNcS7HtxBJuAk9ohvxQYGGNuw2ZbZXPvtT5CQrNyMWSXfePR2Aqq95yj5QzBWeTUbJxfMeVwVfGTRx` |

### TSLAx/USDC Pool

| Item | Value |
|------|-------|
| Pool State | `2QpkNT4Jd4s4SijMYuZqf8enf9XJCBvrS4LhQA5zNj5J` |
| Token 0 (TSLAx) | `XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB` (8 decimals, Token-2022) |
| Token 1 (USDC) | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (6 decimals, SPL Token) |
| Token Vault 0 (TSLAx) | `yiiw8HHzi43rRhVAojy2xsUDn5QbCdNGbZEYhXobLVt` |
| Token Vault 1 (USDC) | `3N8Bf1Qr3PfhbHuUkJh7AuNZBerLp92WdPS2Q5Ky8RoN` |
| Observation State | `9W8gREU5oLLDzB6pUebKHacx23KTx8q9XgPVbuStHYo` |
| Create TX | `3SLbRpDq8Q7mXqP5CYKdLcgs7WU5CRzshVf9d6uS2PvdoAUy2mNNFBmmBKSpzHUhRRejS5ZnZvsHqce59A4RLhbS` |
| Fee | 0.25% → 100% to LP |

Solscan: https://solscan.io/account/2QpkNT4Jd4s4SijMYuZqf8enf9XJCBvrS4LhQA5zNj5J

### 价格

| Item | Value |
|------|-------|
| 初始设定价格 | 1 TSLAx = 394.4 USDC |
| 当前价格 | 1 TSLAx = 395.04 USDC |
| Tick Current | 13738 |
| sqrtPriceX64 | 36664101992161353021 |
| Pool Liquidity | 61791579 |

### Vault 余额

| Token | 数量 | 约价值 |
|-------|------|--------|
| TSLAx | 0.01547 | $6.11 |
| USDC | 6.10 | $6.10 |
| **总计** | | **$12.21** |

### 活跃 Position

| Item | Value |
|------|-------|
| NFT Mint | `DafYfVnhWGG1DEWorgLyrk11UNQuLg3pgsEvQJDKKMZw` |
| Liquidity | 61791579 |
| Tick Range | [12720, 14760] |
| Price Range | [356.78, 437.51] USDC/TSLAx |
| Open TX | `fY37Y481TjFj9c6auVASvi3MbsVqc2uKQdwZtWfsq6312nBLKvQN2WLKW5pRwji3QSRvA1kX6RJb8wjuenufeZ7` |

### Swap 测试

| Item | Value |
|------|-------|
| 方向 | USDC → TSLAx |
| 输入 | 0.1 USDC |
| 输出 | 0.00025271 TSLAx |
| 成交价 | 1 TSLAx = 395.71 USDC |
| Fee | 0.00025 USDC (0.25%) |
| Protocol Fee | 0 ✅ |
| Fund Fee | 0 ✅ |
| TX | `3FwRUqXnSr6FDBq3z8EQyW187mEVuVb5F8WKJZmXEw19LRNyU9qZrjuQVo81QbqbKBpk89yVNhSMv1SMvsCkMPrb` |

---

## 4. 废弃池子（错误价格） ⚠️

> 首次部署时价格公式有 bug（`10^decimals0/10^decimals1` 写反了），导致池子价格为 ~3,963,834 USDC/TSLAx（应为 ~394.4）。已撤出全部流动性并关闭 positions。池子为 PDA 账户无法删除，但 liquidity=0，不会产生任何交易。

### AmmConfig (index=0)

| Item | Value |
|------|-------|
| Address | `4FvxLbieMYhoQMgtEv5cmYtKaatMaSN5hA7jbJUcm4E7` |
| Create TX | `3Fi4anFMyxPzMUmeeMCq2vGTLCarnSF2CZ3C9F1fyWEE1oPGBMhsM9X4ioNjYMsnhadpZsnNrWNqMN9FSXscT6bb` |
| 状态 | 废弃（关联池子价格错误） |

### TSLAx/USDC Pool（废弃）

| Item | Value |
|------|-------|
| Pool State | `HBs5ufwcDnrfcVqNv7Mamkocdnb2mBY11kF7FQyNLSkg` |
| Token Vault 0 (TSLAx) | `F9r9zsCWewXeTfUJyAkV4EHrNyHgfPGm3WyWWqPVJmaC` |
| Token Vault 1 (USDC) | `EfKMZZ8PSS6L9QwznPs7Lw2RMK99wkYmGvs4nHvXTkVk` |
| Observation | `5ftdv2Fjf4xqnaMaGAsGTnC8zwbtHQMqmpv9uT9qwMxG` |
| Create TX | `xCZGqG9c4C9eD47kEAt86ffc6Pxa8Z4T7qbjJK4XXBEx5MYxUMQZaVKZwBA3rxwJ2PrqZbBZ2sJ79UmwVKU6SNH` |
| 错误价格 | 1 TSLAx = ~3,963,834 USDC |
| 当前 Liquidity | 0 |
| Vault TSLAx | 0.00000003（dust） |
| Vault USDC | 0.000004（dust） |
| 锁定租金 | ~0.012 SOL（PDA 不可回收） |

### 废弃 Positions（已关闭）

| NFT Mint | Withdraw TX | Close TX |
|----------|-------------|----------|
| `6qJdDAKzEW4neqnbEwvg3wjEVrd5N8HPmojGN9v3mgzC` | `M5AhTneTwrr3pTAVhifB45QWxmRXncBzrY6UijiypXdAsVBMDu7gmhvGa5wrzzHnjWDnXD4Lh56wnYYSC7s7WgH` | `2mKvHr9yhjb2oQfVJtG9BcvKNX1z9aWgQ3y5gakYD2g8MDdQVZRE47Qgx7HyL8DW9MYsy6S3KSr2uk1e3U1oynZL` |
| `FRuA3SCNgbJf9S6XdYibdMWuqMCGojy94BPR5b2aFdAc` | `3phm7Q1V88VPftkiirGJmxD5afqhgz4ctY6ARPQrL662Z7LSnHgVwiPEoQH1rqbP7oPQXaf3oDAyHJzLG9iEtRDA` | `2CdM6NP1KYoy6zVqvyUezBsqjmfgyWdeFYbhft6GXT1u5gCT8SWACefoWdaGVhdmgsJRNf1mvqfnxGA48ykrXXar` |

### 废弃 Swap（错误价格下执行）

| Item | Value |
|------|-------|
| 输入 | 1 USDC |
| 输出 | 0.00000025 TSLAx |
| 成交价 | 1 TSLAx ≈ 4,000,000 USDC（错误） |
| 损失 | ~1 USDC |
| TX | `zat7ZkbFva8q2WARc6xw1WfSMLuGihbrmqphdL9eFV7fEiqhGn19tyNSfEeoxbL7UCYJ4d8Jg1NepfHuRud15Wi` |

---

## 5. SOL 成本汇总

| 项目 | SOL | 可回收 |
|------|-----|--------|
| Program deploy | ~8.67 | ✅ `solana program close` |
| IDL upload | ~0.15 | ✅ `anchor idl close` |
| AmmConfig index=0（废弃） | 0.0017 | ❌ PDA 不可回收 |
| AmmConfig index=1（活跃） | 0.0017 | ❌ PDA 不可回收 |
| TSLAx 白名单 | 0.0016 | ❌ PDA 不可回收 |
| 废弃池子 (Pool + Vault + Observation + Bitmap) | 0.0615 | ❌ PDA 不可回收 |
| 活跃池子 (Pool + Vault + Observation + Bitmap) | 0.0615 | ❌ PDA 不可回收 |
| 废弃 Positions × 2（已关闭回收） | 0 | — |
| 活跃 Position | 0.009 | 部分可回收 |
| 废弃池子 TickArray | ~0.072 | ❌ PDA 不可回收 |
| 活跃池子 TickArray | ~0.072 | ❌ PDA 不可回收 |
| 交易手续费 | ~0.01 | ❌ |
| **总计** | **~9.11** | |

初始余额: 18.70 SOL → 当前余额: ~9.52 SOL

---

## 6. Bug 修复记录

### 价格公式 Bug（已修复）

**文件**: `scripts/mainnet-tslax-usdc.ts`

CLMM rawPrice = token1_smallest / token0_smallest。将人类价格转为 rawPrice 时：

```
// ❌ 错误（导致价格偏高 10000 倍）
price = TSLAX_PRICE * 10^decimals0 / 10^decimals1
      = 394.4 * 10^8 / 10^6 = 39440

// ✅ 正确
price = TSLAX_PRICE * 10^decimals1 / 10^decimals0
      = 394.4 * 10^6 / 10^8 = 3.944
```

### RefCell Double-Borrow Bug（已修复）

Swap 时 `remainingAccounts` 传入重复的 tick array PDA 会导致 `RefCell already mutably borrowed` panic。修复方式：对 tick array 去重后再传入。

---

## 7. 运维指南

### 清理顺序（必须严格遵守）

1. `decreaseLiquidityV2` — 撤出流动性
2. `closePosition` — 关闭仓位（token_program 用 `TOKEN_2022_PROGRAM_ID`）
3. `anchor idl close` — 关闭 IDL（**必须在关闭 program 之前**）
4. `solana program close` — 关闭 program（回收 ~8.67 SOL）

> ⚠️ 如果先关 program 再关 IDL，IDL 租金 (~0.15 SOL) 将永久锁定。

### 相关脚本

| 脚本 | 用途 |
|------|------|
| `scripts/mainnet-tslax-usdc.ts` | 创建 AmmConfig + 池子 + 开仓 + Swap（幂等） |
| `scripts/withdraw-old-pool.ts` | 撤出旧池子流动性 + 关仓 |
| `scripts/withdraw-new-pool.ts` | 撤出新池子流动性 + 关仓 |
| `scripts/decode-pool.ts` | 解码池子链上数据 |

运行方式：
```bash
ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
pnpm tsx scripts/<script>.ts
```

---

## 8. Solscan 链接

| 项目 | 链接 |
|------|------|
| Program | https://solscan.io/account/CftvdSTmVaaXg4YGKhuCCWo2uPhd9RTY35JyyKqadXnX |
| 活跃池子 | https://solscan.io/account/2QpkNT4Jd4s4SijMYuZqf8enf9XJCBvrS4LhQA5zNj5J |
| 活跃 AmmConfig | https://solscan.io/account/DCYTDLDRTb6nwmRsqFUeNEvZrVXNryKA7SB8dCNQWwhP |
| 废弃池子 | https://solscan.io/account/HBs5ufwcDnrfcVqNv7Mamkocdnb2mBY11kF7FQyNLSkg |
| 废弃 AmmConfig | https://solscan.io/account/4FvxLbieMYhoQMgtEv5cmYtKaatMaSN5hA7jbJUcm4E7 |
| Swap TX（活跃池子） | https://solscan.io/tx/3FwRUqXnSr6FDBq3z8EQyW187mEVuVb5F8WKJZmXEw19LRNyU9qZrjuQVo81QbqbKBpk89yVNhSMv1SMvsCkMPrb |
