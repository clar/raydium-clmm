# Raydium CLMM Fork 部署记录

本目录包含 Raydium CLMM fork 项目部署到 Solana devnet 的完整记录。

## 文件索引

| 文件 | 说明 |
|------|------|
| [01-environment-setup.md](./01-environment-setup.md) | 环境配置与验证 |
| [02-build-deploy.md](./02-build-deploy.md) | 项目构建与部署 |
| [03-fork-behavior-test.md](./03-fork-behavior-test.md) | Fork 行为验证测试 |
| [04-pool-creation.md](./04-pool-creation.md) | 流动性池创建 |
| [05-swap-test.md](./05-swap-test.md) | Swap 功能测试与费用分析 |
| [06-git-commits.md](./06-git-commits.md) | Git 提交记录 |
| [07-contract-architecture.md](./07-contract-architecture.md) | 合约架构与交互说明 |
| [08-deployment-costs.md](./08-deployment-costs.md) | 部署费用明细 (押金/交易费) |
| [09-upgrade-authority-analysis.md](./09-upgrade-authority-analysis.md) | 程序升级能力分析 |

## 快速概览

| 项目 | 状态 |
|------|------|
| 环境配置 | ✅ 完成 |
| 项目构建 | ✅ 完成 |
| Devnet 部署 | ✅ 完成 |
| Fork 行为验证 | ✅ 通过 |
| 流动性池创建 | ✅ 成功 |
| Swap 测试 | ✅ 通过 |

## 关键信息

| 项目 | 值 | Solscan |
|------|------|---------|
| Program ID | `FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28` | [查看](https://solscan.io/account/FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28?cluster=devnet) |
| IDL Account | `9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL` | [查看](https://solscan.io/account/9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL?cluster=devnet) |
| AmmConfig | `GkbFNrEJebunoSCniGGa3nPV2DDA8AdrPg6kZm7ExHqZ` | [查看](https://solscan.io/account/GkbFNrEJebunoSCniGGa3nPV2DDA8AdrPg6kZm7ExHqZ?cluster=devnet) |
| Admin Wallet | `9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA` | [查看](https://solscan.io/account/9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA?cluster=devnet) |

Network: Solana Devnet
