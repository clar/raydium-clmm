# fork.md — Raydium CLMM fork 流程

本文记录从 fork Raydium CLMM 到 devnet 部署并交互的完整指导流程。  
每个步骤只包含：**过程说明 + 需要执行的命令**。

---

## 1. 安装 / 切换工具链（一次性）

切换 Rust 版本：
```bash
rustup default 1.82.0
```

安装 Solana / Anza CLI（提供 cargo build-sbf）：

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/v3.1.6/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

安装并切换 Anchor 版本：

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.1
avm use 0.31.1
```

---

## 2. 拉取 fork 仓库并切换到修改分支

```bash
git clone git@github.com:CSeanXu/raydium-clmm.git
cd raydium-clmm
git checkout codex/enforce-zero-fees-in-ammconfig
```

---

## 3. 安装脚本依赖（用于与合约交互）

```bash
pnpm i
```

---

## 4. 配置 devnet 并准备部署钱包

切换到 devnet：

```bash
solana config set --url https://api.devnet.solana.com
```

给当前钱包空投 SOL：

[faucet](https://faucet.solana.com/)

```bash
solana airdrop 5

# ⚠️ 测试中单次部署消耗了8.2SOL，可在faucet获取 （可连接GitHub增加Limit）

# network: devnet
# amount: 5 SOL
# 2 requests every 8 hours
```

---

## 5. 生成并同步 Program ID（部署前关键步骤）

本步骤用于确定并固定 Program ID，必须在首次部署前完成。

### 5.1 先执行一次 build，生成 program keypair

```bash
anchor build
```

这一步会在 `target/deploy/` 目录下生成 program 的 keypair 文件，例如：

* `target/deploy/raydium_amm_v3-keypair.json`

---

### 5.2 从 keypair 计算 Program ID

```bash
solana address -k target/deploy/raydium_amm_v3-keypair.json
```

记录输出的 **Program ID**。

---

### 5.3 修改 program 入口文件中的 declare_id

打开对应的 program 入口文件，例如：

* `programs/raydium_amm_v3/src/lib.rs`

将其中的：

```rust
declare_id!("旧的_program_id");
```

修改为：

```rust
declare_id!("第 5.2 步得到的 Program ID");
```

---

### 5.4 修改 Anchor.toml 中的 program id

打开 `Anchor.toml`，在对应网络（如 devnet）下修改：

```toml
[programs.devnet]
raydium_amm_v3 = "第 5.2 步得到的 Program ID"
```

---

### 5.5 再次 build，生成并同步 IDL

```bash
anchor build
```

这一步会重新生成：

* `target/idl/raydium_amm_v3.json`

---

### 5.6 校验 Program ID 是否在所有位置一致

确认以下 **四处** 完全一致：

1. `programs/raydium_amm_v3/src/lib.rs` 中的

   ```rust
   declare_id!("...")
   ```

2. `Anchor.toml` 中的

   ```toml
   [programs.devnet]
   raydium_amm_v3 = "..."
   ```

3. `target/deploy/raydium_amm_v3-keypair.json` 对应的地址
   （使用 `solana address -k` 查看）

4. `target/idl/raydium_amm_v3.json` 中的

   ```json
   {
     "metadata": {
       "address": "..."
   }
   ```

只有当以上四处完全一致时，Program ID 才算 **真正同步完成**。

---

## 6. 部署到 devnet

```bash
anchor deploy --provider.cluster devnet
```

部署完成后，记录输出的 Program ID，用于后续交互脚本。

---

## 7. 与部署后的合约交互（示例）

运行创建 AmmConfig 的脚本：

```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
pnpm tsx scripts/create-amm-config.ts
```

---

## 8. 验证 fork 行为（建议）

在脚本或测试中验证以下行为：

* `protocol_fee_rate != 0` 时，交易失败
* `fund_fee_rate != 0` 时，交易失败
* `protocol_fee_rate == 0` 且 `fund_fee_rate == 0` 时，创建成功

确认 fork 后的 CLMM 在链上强制执行零 protocol / fund fee。
