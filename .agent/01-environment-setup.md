# 01 - 环境配置与验证

## 目标

验证开发环境满足 Raydium CLMM 构建和部署要求。

## 执行步骤

### 1.1 检查 Rust 版本

```bash
rustc --version
```

**输出:**
```
rustc 1.82.0 (f6e511eec 2024-10-15)
```

**状态:** ✅ 符合要求 (fork.md 要求 1.82.0)

---

### 1.2 检查 Solana CLI 版本

```bash
solana --version
```

**输出:**
```
solana-cli 3.1.6 (src:63057a7b; feat:2086771155, client:Agave)
```

**状态:** ✅ 符合要求

---

### 1.3 检查 Anchor CLI 版本

```bash
anchor --version
```

**输出:**
```
anchor-cli 0.31.1
```

**状态:** ✅ 符合要求 (fork.md 要求 0.31.1)

---

### 1.4 检查 Solana 网络配置

```bash
solana config get
```

**输出:**
```
Config File: /root/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com 
WebSocket URL: wss://api.devnet.solana.com/ (computed)
Keypair Path: /root/.config/solana/id.json 
Commitment: confirmed
```

**状态:** ✅ 已配置为 devnet

---

### 1.5 检查钱包余额

```bash
solana balance
```

**输出:**
```
17.29825152 SOL
```

**状态:** ✅ 余额充足 (部署需要约 8-9 SOL)

---

### 1.6 获取钱包地址

```bash
solana address
```

**输出:**
```
9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA
```

---

## 环境总结

| 组件 | 要求版本 | 实际版本 | 状态 |
|------|----------|----------|------|
| Rust | 1.82.0 | 1.82.0 | ✅ |
| Solana CLI | - | 3.1.6 | ✅ |
| Anchor CLI | 0.31.1 | 0.31.1 | ✅ |
| 网络 | devnet | devnet | ✅ |
| 钱包余额 | >8 SOL | 17.29 SOL | ✅ |

## 相关文件

- 参考文档: `fork.md` 第 1-4 节
