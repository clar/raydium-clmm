# 02 - 项目构建与部署

## 目标

构建 Raydium CLMM 程序并部署到 Solana devnet。

## 执行步骤

### 2.1 配置 Anchor.toml

修改 `Anchor.toml` 启用 devnet feature:

```toml
[features]
seeds = false
resolution = true

[features.devnet]
amm_v3 = ["devnet"]

[programs.devnet]
amm_v3 = "FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

**状态:** ✅ 完成

---

### 2.2 首次构建

```bash
anchor build -- --features devnet
```

**输出:**
```
Compiling raydium-amm-v3 v0.1.0
warning: `raydium-amm-v3` (lib) generated 45 warnings
Finished `release` profile [optimized] target(s) in 44.14s
```

**状态:** ✅ 构建成功 (有警告但无错误)

---

### 2.3 验证 Program Keypair

```bash
solana address -k target/deploy/raydium_amm_v3-keypair.json
```

**输出:**
```
FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28
```

**状态:** ✅ Keypair 已生成

---

### 2.4 验证 Program ID 同步

检查以下四处 Program ID 是否一致:

| 位置 | 值 | 状态 |
|------|------|------|
| `target/deploy/raydium_amm_v3-keypair.json` | FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28 | ✅ |
| `programs/amm/src/lib.rs` (devnet) | FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28 | ✅ |
| `Anchor.toml` [programs.devnet] | FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28 | ✅ |
| `target/types/amm_v3.ts` | FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28 | ✅ |

**状态:** ✅ 所有位置一致

---

### 2.5 修改 Admin 地址

修改 `programs/amm/src/lib.rs` 中的 admin 地址为当前钱包:

```rust
pub mod admin {
    use super::{pubkey, Pubkey};
    #[cfg(feature = "devnet")]
    pub const ID: Pubkey = pubkey!("9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA");
    #[cfg(not(feature = "devnet"))]
    pub const ID: Pubkey = pubkey!("9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA");
}
```

**状态:** ✅ 完成

---

### 2.6 重新构建

```bash
anchor build -- --features devnet
```

**状态:** ✅ 构建成功

---

### 2.7 部署到 Devnet

```bash
anchor deploy --provider.cluster devnet
```

**输出:**
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: /root/.config/solana/id.json
Deploying program "raydium_amm_v3"...
Program path: /root/workspace/raydium-clmm/target/deploy/raydium_amm_v3.so...
Program Id: FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28

Signature: 4iZUVXepVaKM7yEdMMXXi68WZR8m7VbBgNYZqfzBxw1BDQnKRaen6o62qS53Eitd66K6pHJyDFM2DEZ1DhwzbZgC

Deploy success
```

**状态:** ✅ 部署成功

---

### 2.8 验证链上部署

```bash
solana program show FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28
```

**输出:**
```
Program Id: FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: 6J4YypNFdC9Dym2pLxUqWGkGdYetznPbWiLT5gA2MA89
Authority: 9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA
Last Deployed In Slot: 435934972
Data Length: 1248976 (0x130ed0) bytes
Balance: 8.69407704 SOL
```

**状态:** ✅ 链上验证通过

---

### 2.9 生成 IDL

```bash
anchor idl build -o target/idl/amm_v3.json -- --features devnet
```

**输出:**
```
Finished `test` profile in 0.58s
```

**状态:** ✅ IDL 生成成功

---

### 2.10 安装脚本依赖

```bash
pnpm i
pnpm add @solana/spl-token
```

**状态:** ✅ 依赖安装完成

---

## 部署总结

| 项目 | 值 |
|------|------|
| Program ID | `FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28` |
| Network | Solana Devnet |
| Upgrade Authority | `9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA` |
| Data Length | 1,248,976 bytes (1.2 MB) |
| 部署消耗 | ~8.69 SOL |

## 生成的文件

| 文件 | 路径 |
|------|------|
| 编译产物 | `target/deploy/raydium_amm_v3.so` |
| Program Keypair | `target/deploy/raydium_amm_v3-keypair.json` |
| IDL | `target/idl/amm_v3.json` |
| TypeScript 类型 | `target/types/amm_v3.ts` |

---

### 2.11 上传 IDL 到链上

```bash
anchor idl init --filepath target/idl/amm_v3.json FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28 --provider.cluster devnet
```

**输出:**
```
Idl data length: 10928 bytes
Idl account created: 9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL
```

**状态:** ✅ IDL 上传成功

**链上验证:**
- [Solscan 查看 IDL Account](https://solscan.io/account/9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL?cluster=devnet)

---

## 链上验证链接

| 类型 | 地址 | Solscan |
|------|------|---------|
| Program | `FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28` | [查看](https://solscan.io/account/FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28?cluster=devnet) |
| IDL Account | `9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL` | [查看](https://solscan.io/account/9QnksUhQT5i2ze1r9YAsXEhMeRLsKjtp18DnG1xDLoYL?cluster=devnet) |
| ProgramData | `6J4YypNFdC9Dym2pLxUqWGkGdYetznPbWiLT5gA2MA89` | [查看](https://solscan.io/account/6J4YypNFdC9Dym2pLxUqWGkGdYetznPbWiLT5gA2MA89?cluster=devnet) |

---

## 相关文件

- 参考文档: `fork.md` 第 5-6 节
