# Mainnet Deployment Report

> Raydium CLMM Fork — Zero Protocol/Fund Fees
> Deployed: 2026-03-04 | Updated: 2026-03-15

---

## 1. Program

| Item | Value |
|------|-------|
| Program ID | `CftvdSTmVaaXg4YGKhuCCWo2uPhd9RTY35JyyKqadXnX` |
| Deploy TX | `5Yb7Ygx2ADWe7ZmDKAUEo2NzVfSeCThUkNG7pYJdLwnCKBKQKyMPb3gQYCKZwgwCoX3VCpApgygachnMzkmU2P2d` |
| IDL Account | `5eXGUyeWPmfG7CMuCsKaJiPbYBKSetELeKDKTYsBLRcC` |
| Upgrade Authority | `9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA` |
| Source Code | `release/zero-fees` branch |
| Code Verify | ✅ Verified (deterministic build hash match) |
| Deterministic Hash | `60e8dc58b8b666829358b88470d16dca469fd82db03e457a5eafa523a1019888` |
| Upgrade TX | `1n52AVcZGVMNfLtT3d6US7NqufFMT7moZ9FCSmxCPQRjCZZgJd13h6wCojjFvsAe6rbKE691QLYDXoqin1uoTPu` |
| Verify Params TX | `5fWU6DfZkfH3naaHUQcfqh4dos5Di4QH4atGKifxdt5ECHdfXMbfMxon7NY1yTL1s5iRygrXwmBfs2SXpyneEubG` |

**核心修改**：所有交易手续费 (0.25%) 100% 归 LP，protocol_fee 和 fund_fee 被硬编码为 0。

Solscan: https://solscan.io/account/CftvdSTmVaaXg4YGKhuCCWo2uPhd9RTY35JyyKqadXnX

---

## 2. Token 信息

所有 xStock 代币为 Token-2022 标准（8 decimals，带 freeze extension），需先创建白名单才能建池。

| Symbol | Name | Mint | Program |
|--------|------|------|---------|
| USDC | USD Coin | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | SPL Token (6 dec) |
| TSLAx | Tesla xStock | `XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB` | Token-2022 (8 dec) |
| CRCLx | Circle xStock | `XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1` | Token-2022 (8 dec) |
| MSTRx | MicroStrategy xStock | `XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ` | Token-2022 (8 dec) |
| NVDAx | NVIDIA xStock | `Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh` | Token-2022 (8 dec) |
| AMZNx | Amazon xStock | `Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg` | Token-2022 (8 dec) |
| AAPLx | Apple xStock | `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp` | Token-2022 (8 dec) |
| GOOGLx | Alphabet xStock | `XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN` | Token-2022 (8 dec) |
| QQQx | Nasdaq xStock | `Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ` | Token-2022 (8 dec) |
| METAx | Meta xStock | `Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu` | Token-2022 (8 dec) |
| SPYx | SP500 xStock | `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W` | Token-2022 (8 dec) |

---

## 3. 活跃池子 ✅

### AmmConfig (index=1)

| Item | Value |
|------|-------|
| Address | `DCYTDLDRTb6nwmRsqFUeNEvZrVXNryKA7SB8dCNQWwhP` |
| Tick Spacing | 60 |
| Trade Fee Rate | 2500 (0.25%) |
| Protocol Fee Rate | 0 |
| Fund Fee Rate | 0 |
| Create TX | `5ASyvYnFhGgNcS7HtxBJuAk9ohvxQYGGNuw2ZbZXPvtT5CQrNyMWSXfePR2Aqq95yj5QzBWeTUbJxfMeVwVfGTRx` |

> 所有 10 个池子共用同一个 AmmConfig。Fee 0.25% → 100% 归 LP，protocol_fee=0, fund_fee=0。

### 池子汇总

| Pool | Init Price | Swap Price | Pool State | Create TX |
|------|-----------|------------|------------|-----------|
| TSLAx/USDC | $394.40 | $395.71 ✅ | `2QpkNT4Jd4s4SijMYuZqf8enf9XJCBvrS4LhQA5zNj5J` | `3SLbRp...` |
| CRCLx/USDC | $115.00 | $115.45 ✅ | `Fae5jHTV3PN9vPz38xNUmxDy7PR4uxrMideVMMruagCk` | `2Yz8GJ...` |
| MSTRx/USDC | $141.00 | $141.55 ✅ | `CM666S279X7gnitT4E4yGc4pgMZdXpw234UzbZ1RYw1W` | `2A3J6A...` |
| NVDAx/USDC | $180.00 | $180.75 ✅ | `3HSMw7pqDKncNMAdZp3vJ3ii5MBFeVPThHS9RMj4UWtV` | `41efT3...` |
| AMZNx/USDC | $208.00 | $208.87 ✅ | `6iQrPbTadRRJEP8hZyncq6QpFkvuRDLWSiy2PQeSQFUB` | `5K6Lin...` |
| AAPLx/USDC | $257.00 | $258.08 ✅ | `ESY4dgULhumYnySH5kzvq4y11Bttrau9s16PfAmptWFD` | `33zbJP...` |
| GOOGLx/USDC | $299.00 | $300.26 ✅ | `DR35GWcmjVBozKSicWw7Wt5Ho3rJnj1g3cyECuPsdcrG` | `4U9SoM...` |
| QQQx/USDC | $594.00 | $596.48 ✅ | `DNTUvVY1up9FFUunUXPxwY98ZdeuqMVm7gCJYbdY3AZ2` | `5u8hJo...` |
| METAx/USDC | $614.00 | $616.60 ✅ | `UJNTnEHeD4GvmfNzp7755HYLKkwxdHiVqUu7MhhMJRK` | `2q96mt...` |
| SPYx/USDC | $662.00 | $664.76 ✅ | `CWzFrp3fiXQkVGYwK3e6C8PfMnKm3teFJicHsYUZCzom` | `3heSbG...` |

> 所有 swap 测试均为 0.1 USDC → xStock，成交价与设定价格偏差 < 1%。

### TSLAx/USDC Pool（详细）

| Item | Value |
|------|-------|
| Pool State | `2QpkNT4Jd4s4SijMYuZqf8enf9XJCBvrS4LhQA5zNj5J` |
| Token Vault 0 (TSLAx) | `yiiw8HHzi43rRhVAojy2xsUDn5QbCdNGbZEYhXobLVt` |
| Token Vault 1 (USDC) | `3N8Bf1Qr3PfhbHuUkJh7AuNZBerLp92WdPS2Q5Ky8RoN` |
| Observation State | `9W8gREU5oLLDzB6pUebKHacx23KTx8q9XgPVbuStHYo` |
| Position NFT | `DafYfVnhWGG1DEWorgLyrk11UNQuLg3pgsEvQJDKKMZw` |
| Liquidity | ~$12 (~0.015 TSLAx + ~6 USDC) |
| Tick Range | [12720, 14760] |
| Swap TX | `3FwRUqXnSr6FDBq3z8EQyW187mEVuVb5F8WKJZmXEw19LRNyU9qZrjuQVo81QbqbKBpk89yVNhSMv1SMvsCkMPrb` |

### CRCLx/USDC Pool

| Item | Value |
|------|-------|
| Pool State | `Fae5jHTV3PN9vPz38xNUmxDy7PR4uxrMideVMMruagCk` |
| Token Vault 0 (CRCLx) | `HjZKEgonVRMV6R6wmNE14J7Bz6V4gCuzaCVckuJtXPvb` |
| Token Vault 1 (USDC) | `87dWHju64JgxQvT82aDpnbW7ve4ShytxseNTHo4f5crB` |
| Position NFT | `m4ToDkhE68BqvBMG3bX9wNmofs6yZQhXvhM9efNDHGC` |
| Liquidity | ~$7 (~0.030 CRCLx + ~3.6 USDC) |
| Swap TX | `2yQBPWdM81MSNNkFxVoEcxHAKaTJksussUWGYuvByTEkaFSYgcbJZw8Fgh4dppu2kgsrQQFnBkmTnf1zDzpr2FnD` |

### MSTRx/USDC Pool

| Item | Value |
|------|-------|
| Pool State | `CM666S279X7gnitT4E4yGc4pgMZdXpw234UzbZ1RYw1W` |
| Token Vault 0 (MSTRx) | `78ZKxVe37HDHAjjnCJLzk4to7EwLdh1qzTHJF5XDReLD` |
| Token Vault 1 (USDC) | `7uNcwMRvFeT7wexhDaw7gthvQvP4kqGg2rurZ15Xe5bc` |
| Position NFT | `HPTJ5d6no1KQTo5yEhttBTdye9L3YEVPF5zGnjoTwR6P` |
| Liquidity | ~$6 (~0.025 MSTRx + ~3.6 USDC) |
| Swap TX | `3FGgyai3TrEYpXhBExfV32bs3RNPYNLDTPYEWEAXXstp7WqKVVrs9eVcsVudwzKy52kLg81AU4qFLc8UAZzGBQrN` |

### NVDAx/USDC Pool

| Item | Value |
|------|-------|
| Pool State | `3HSMw7pqDKncNMAdZp3vJ3ii5MBFeVPThHS9RMj4UWtV` |
| Token Vault 0 (NVDAx) | `9icrsaFpa2ZRNXBoZ3fEZ8mt6NGLJuZWhatypSZQrpAc` |
| Token Vault 1 (USDC) | `6sEDe2WBGyxDq4k66U3NjPixyAQHkao7EytePtiStn7N` |
| Position NFT | `P9CvJjd85zcWQRed9bQAxEHeXRyjbtkGCJt7e5tyFCM` |
| Liquidity | ~$6 (~0.017 NVDAx + ~3 USDC) |
| Swap TX | `38b3kstjcBRDF8jzCDZyLtAfVtqKPKGYY41DAYyBhb22DzdmvwtKw2KQPwtamfnmB62fNdbhdkPuPSbmEKvLC6nT` |

### AMZNx/USDC Pool

| Item | Value |
|------|-------|
| Pool State | `6iQrPbTadRRJEP8hZyncq6QpFkvuRDLWSiy2PQeSQFUB` |
| Token Vault 0 (AMZNx) | `7Syof1XGqnB63SVMvJrpHsPJD4DSxwg9M5RoGTjzP5dS` |
| Token Vault 1 (USDC) | `FwKmaneuhKXcccP3QLM2oJRVDC15BpRdH6g36LCxWCbz` |
| Position NFT | `H5NVFjH6s1s8E9edAQqGHY8oSnKcP6ayeyKu3YgvVZVB` |
| Liquidity | ~$6 (~0.014 AMZNx + ~3 USDC) |
| Swap TX | `4iHBKK5YFCTz9JNnk3WA6iFvbG7jnrmvcf9QzfHweizfVKxyEz37YhnETpzWQsr7WMs19nP4axbonen7ZUp1cURo` |

### AAPLx/USDC Pool

| Item | Value |
|------|-------|
| Pool State | `ESY4dgULhumYnySH5kzvq4y11Bttrau9s16PfAmptWFD` |
| Token Vault 0 (AAPLx) | `2JhtyqrcbzdUpdBiSKMNgftQ3SZNkChCD9Tbr8G32uKT` |
| Token Vault 1 (USDC) | `EtCQGNCAZnkxrBeU7dbxJpMcZeimFdAs2cuTebHYQxyE` |
| Position NFT | `FaebdkEAShwoRHyymUUaGnMpquNxjchRFk8S7Zu9cRyU` |
| Liquidity | ~$6 (~0.011 AAPLx + ~3 USDC) |
| Swap TX | `5X1ELQMJqmU21hGemKScECMAK9PaV84nsx4EUK3RjQSV4ZQyeipGA3XgyN95gSJ6fJT3yCdUbHhEZjWT3ckiCPcU` |

### GOOGLx/USDC Pool

| Item | Value |
|------|-------|
| Pool State | `DR35GWcmjVBozKSicWw7Wt5Ho3rJnj1g3cyECuPsdcrG` |
| Token Vault 0 (GOOGLx) | `8b5MVBpxQ9fHcGiyLqYSxbDcGFXvaGwC3chdUjFugKR2` |
| Token Vault 1 (USDC) | `2X6XYN7aDjWTTxo2eY41AFUAfRvqeJ7GeyxpTkH2xt4v` |
| Position NFT | `F4HNgQ7oweuUfZNdrYjEGvgQQ5MEYwpH2Hvt6St6MX2M` |
| Liquidity | ~$6 (~0.010 GOOGLx + ~3 USDC) |
| Swap TX | `3ufCC9WMRAX2MXsETQgVV3WRR9QGEr8SmsEzEPk4xgBzAV9PUSACwFoa74bdJsVwRqRSiFUkGx51z7qd9ar4THHD` |

### QQQx/USDC Pool

| Item | Value |
|------|-------|
| Pool State | `DNTUvVY1up9FFUunUXPxwY98ZdeuqMVm7gCJYbdY3AZ2` |
| Token Vault 0 (QQQx) | `2K8jfEB2MWN3ZH5JETGv4VMQVsDRyJqw7id9ZaoVmJsb` |
| Token Vault 1 (USDC) | `CgiJpXTLSakkSYNguzXid3EcqUEiTo6x8yaXNLiqkQzF` |
| Position NFT | `HuRGw65q22V362458hSXhoQUBts383JYqJ4CbTQDXYAp` |
| Liquidity | ~$6 (~0.005 QQQx + ~3 USDC) |
| Swap TX | `3KBUMPAt144zLq7qCDtwbYvikBG7zh3q6cnoxsnsw7jiSrCvnjSdfvFWwEXfYn85gPp7CX5u3JqkWnd2UjZPfeBz` |

### METAx/USDC Pool

| Item | Value |
|------|-------|
| Pool State | `UJNTnEHeD4GvmfNzp7755HYLKkwxdHiVqUu7MhhMJRK` |
| Token Vault 0 (METAx) | `GVbFopqZhPmAx3DT3nzGfChQLjLh5u5zk1ZPTrwS24KZ` |
| Token Vault 1 (USDC) | `2s3NhutzSvdMYHc7K8RkXuMoQUeRW8M1zbsj3yzNQ7ke` |
| Position NFT | `H4ouFpyhNxBbmeCyuvBrrWHVog4CD48mUthoKYSy6qEV` |
| Liquidity | ~$6 (~0.005 METAx + ~3 USDC) |
| Swap TX | `2zUe1cth3BZhSbdsytsv55VySqLy15zgYyc91zVwpKJsnSVSETiY8w5bbFHaznuCzGw2HoVppXoeeYjTpGCyESkc` |

### SPYx/USDC Pool

| Item | Value |
|------|-------|
| Pool State | `CWzFrp3fiXQkVGYwK3e6C8PfMnKm3teFJicHsYUZCzom` |
| Token Vault 0 (SPYx) | `8UZMaWJwxEAyvEudt7Rpiehb9A9K7eVvsbKMiEy9z1YN` |
| Token Vault 1 (USDC) | `BFB3Q9ptDwSQ98WXiayW6Tn7xCaxQNTa3fzST4oUXFJ9` |
| Position NFT | `9yJcKybuLhfvRedAYQ8fuGvE71bNxgxfSCrnC66FgmNr` |
| Liquidity | ~$6 (~0.005 SPYx + ~3 USDC) |
| Swap TX | `3z2i8Fkc7fJNGiCj6WEVUxTiYDhEDkmCriTgomiNzDiGQKwvyhiZcvswL1E82sU79eC3nQqV5RxnTyGabhGUq3F4` |

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

## 6. Code Verify（Solscan 开源验证）

### 流程

1. **确定性构建**：`solana-verify build --library-name raydium_amm_v3`（Docker 容器内构建）
2. **程序升级**：用确定性构建的 `.so` 替换链上二进制，使哈希匹配
3. **哈希验证**：链上与本地哈希一致 → `60e8dc58b8b666829358b88470d16dca469fd82db03e457a5eafa523a1019888`
4. **远程提交**：`solana-verify verify-from-repo --remote` 提交到 Solscan

### 关键信息

| Item | Value |
|------|-------|
| 构建工具 | `solana-verify 0.4.11` |
| Rust 版本 | 1.94.0 (stable) |
| Docker 镜像 | `ellipsislabs/solana:2.1.17` (solana-verify 默认) |
| 本地 Hash | `60e8dc58b8b666829358b88470d16dca469fd82db03e457a5eafa523a1019888` |
| 链上 Hash | `60e8dc58b8b666829358b88470d16dca469fd82db03e457a5eafa523a1019888` |
| Commit | `cf6c906` (release/zero-fees) |
| GitHub Repo | `https://github.com/clar/raydium-clmm` |

### 为什么需要 upgrade？

`anchor deploy` 使用本地工具链编译，与 Docker 确定性构建产生的二进制不同（哈希不同）。要通过 Solscan 验证，必须用确定性构建的 `.so` 替换链上程序。

升级过程需要创建临时 buffer 账户（~8.5 SOL 租金押金），升级完成后旧 program data 的租金会退回钱包，**净成本仅为交易手续费（~0.006 SOL）**。

### 注意事项

- 构建时需指定 `--library-name raydium_amm_v3`，否则会尝试构建整个 workspace 导致依赖冲突
- Docker 容器内 rustc 版本较旧，可能需要降级某些依赖（如 `async-lock`、`getrandom`）
- 安装 `solana-verify` 需要 Rust ≥ 1.85.0 和系统库 `libssl-dev pkg-config libudev-dev libhidapi-dev`

---

## 7. Bug 修复记录

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

## 8. 运维指南

### 清理顺序（必须严格遵守）

1. `decreaseLiquidityV2` — 撤出流动性
2. `closePosition` — 关闭仓位（token_program 用 `TOKEN_2022_PROGRAM_ID`）
3. `anchor idl close` — 关闭 IDL（**必须在关闭 program 之前**）
4. `solana program close` — 关闭 program（回收 ~8.67 SOL）

> ⚠️ 如果先关 program 再关 IDL，IDL 租金 (~0.15 SOL) 将永久锁定。

### 相关脚本

| 脚本 | 用途 |
|------|------|
| `scripts/create-xstock-pool.ts` | 通用 xStock/USDC 池子创建脚本（白名单 + 建池 + 开仓 + Swap） |
| `scripts/mainnet-tslax-usdc.ts` | TSLAx/USDC 专用脚本（含 AmmConfig 创建） |
| `scripts/withdraw-old-pool.ts` | 撤出旧池子流动性 + 关仓 |
| `scripts/withdraw-new-pool.ts` | 撤出新池子流动性 + 关仓 |
| `scripts/decode-pool.ts` | 解码池子链上数据 |

运行方式：
```bash
# 通用脚本
ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
pnpm tsx scripts/create-xstock-pool.ts <SYMBOL> <PRICE>
# 例: pnpm tsx scripts/create-xstock-pool.ts CRCLx 115

# 其他脚本
ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
pnpm tsx scripts/<script>.ts
```

---

## 9. Solscan 链接

| 项目 | 链接 |
|------|------|
| Program | https://solscan.io/account/CftvdSTmVaaXg4YGKhuCCWo2uPhd9RTY35JyyKqadXnX |
| AmmConfig | https://solscan.io/account/DCYTDLDRTb6nwmRsqFUeNEvZrVXNryKA7SB8dCNQWwhP |
| TSLAx/USDC | https://solscan.io/account/2QpkNT4Jd4s4SijMYuZqf8enf9XJCBvrS4LhQA5zNj5J |
| CRCLx/USDC | https://solscan.io/account/Fae5jHTV3PN9vPz38xNUmxDy7PR4uxrMideVMMruagCk |
| MSTRx/USDC | https://solscan.io/account/CM666S279X7gnitT4E4yGc4pgMZdXpw234UzbZ1RYw1W |
| NVDAx/USDC | https://solscan.io/account/3HSMw7pqDKncNMAdZp3vJ3ii5MBFeVPThHS9RMj4UWtV |
| AMZNx/USDC | https://solscan.io/account/6iQrPbTadRRJEP8hZyncq6QpFkvuRDLWSiy2PQeSQFUB |
| AAPLx/USDC | https://solscan.io/account/ESY4dgULhumYnySH5kzvq4y11Bttrau9s16PfAmptWFD |
| GOOGLx/USDC | https://solscan.io/account/DR35GWcmjVBozKSicWw7Wt5Ho3rJnj1g3cyECuPsdcrG |
| QQQx/USDC | https://solscan.io/account/DNTUvVY1up9FFUunUXPxwY98ZdeuqMVm7gCJYbdY3AZ2 |
| METAx/USDC | https://solscan.io/account/UJNTnEHeD4GvmfNzp7755HYLKkwxdHiVqUu7MhhMJRK |
| SPYx/USDC | https://solscan.io/account/CWzFrp3fiXQkVGYwK3e6C8PfMnKm3teFJicHsYUZCzom |
| Code Verify | https://verify.osec.io/status/CftvdSTmVaaXg4YGKhuCCWo2uPhd9RTY35JyyKqadXnX |
| 废弃池子 | https://solscan.io/account/HBs5ufwcDnrfcVqNv7Mamkocdnb2mBY11kF7FQyNLSkg |
| 废弃 AmmConfig | https://solscan.io/account/4FvxLbieMYhoQMgtEv5cmYtKaatMaSN5hA7jbJUcm4E7 |
