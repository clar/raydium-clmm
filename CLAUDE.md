# Raydium CLMM Fork - Zero Protocol/Fund Fees

## Project Overview

This is a fork of Raydium CLMM (Concentrated Liquidity Market Maker) on Solana. The core modification enforces **zero protocol and fund fees** — all trade fees (e.g. 0.25%) go 100% to LPs.

### Fork Modification (vs upstream Raydium CLMM)

Three files changed in `programs/amm/src/`:

1. **`instructions/admin/create_amm_config.rs`** — hardcode `protocol_fee_rate` and `fund_fee_rate` to `0`, ignoring caller-supplied values:
   ```rust
   amm_config.protocol_fee_rate = 0;
   amm_config.fund_fee_rate = 0;
   ```

2. **`instructions/admin/update_amm_config.rs`** — force both rates back to `0` after any update, preventing re-enablement:
   ```rust
   amm_config.protocol_fee_rate = 0;
   amm_config.fund_fee_rate = 0;
   ```

3. **`lib.rs`** — replaced program ID and admin address for independent deployment.

## Tech Stack

| Component | Version |
|-----------|---------|
| Rust | 1.82.0 |
| Solana CLI | 2.3.0 (Agave) |
| Anchor CLI | 0.32.1 |
| Node | pnpm + tsx |
| Token Standard | SPL Token + Token-2022 |

## Build & Deploy

```bash
# Build (devnet)
anchor build -- --features devnet

# Build (mainnet, no feature flag)
anchor build

# Deploy
anchor deploy --provider.cluster <cluster>

# Generate IDL
anchor idl build -o target/idl/amm_v3.json -- --features devnet
```

## Key Directories

| Path | Description |
|------|-------------|
| `programs/amm/src/lib.rs` | Program entry, declares program ID & admin address |
| `programs/amm/src/instructions/` | All instruction implementations |
| `programs/amm/src/states/` | Account state definitions (PoolState, AmmConfig, etc.) |
| `programs/amm/src/libraries/` | Math libraries (tick, sqrt_price, liquidity) |
| `fork.md` | Fork flow guide (Chinese), from clone to deploy to interact |
| `target/idl/amm_v3.json` | IDL file |
| `target/types/amm_v3.ts` | TypeScript types |
| `target/deploy/` | Compiled .so and keypair |
| `scripts/` | Deployment & test scripts |

## Program ID Configuration

Program ID must be consistent across 4 locations:
1. `target/deploy/raydium_amm_v3-keypair.json`
2. `programs/amm/src/lib.rs` — `declare_id!(...)` (devnet and mainnet via `#[cfg(feature)]`)
3. `Anchor.toml` — `[programs.devnet]` / `[programs.mainnet]`
4. `target/types/amm_v3.ts`

Admin address is in `programs/amm/src/lib.rs` under `pub mod admin` — currently the same for both devnet and mainnet: `9mvddFmGYCyoCCiQ2hMpRoerezyDkMAztsBVAvHg4ExA`.

## Branch Info

- `main` — base Raydium CLMM with Anchor 0.32.1 upgrade
- `release/zero-fees` — current branch, contains zero-fee enforcement + deployment scripts

## Deployment History

| Environment | Program ID | Status |
|-------------|-----------|--------|
| Devnet (v1) | `FNJHxG95pChntXLTzBxdCPdgcA4iPsjHpJBHPJXmNN28` | Closed |
| Mainnet (v1) | `FXGBNyA7VUWAwhCcXuotQbaHjCteXBLwXiHdwgbbUz2U` | Closed |
| Mainnet (v2) | `CftvdSTmVaaXg4YGKhuCCWo2uPhd9RTY35JyyKqadXnX` | **Active** |

Current IDs in code:
- Devnet: `8kpocpzq5VVz1FbNNCmpb72j8apf8dFb7XsJfYUdCmiC`
- Mainnet: `CftvdSTmVaaXg4YGKhuCCWo2uPhd9RTY35JyyKqadXnX`

### Active Mainnet Accounts
- AmmConfig (index=1): `DCYTDLDRTb6nwmRsqFUeNEvZrVXNryKA7SB8dCNQWwhP`
- TSLAx/USDC Pool: `2QpkNT4Jd4s4SijMYuZqf8enf9XJCBvrS4LhQA5zNj5J`
- IDL Account: `5eXGUyeWPmfG7CMuCsKaJiPbYBKSetELeKDKTYsBLRcC`
- ~~AmmConfig (index=0): `4FvxLbieMYhoQMgtEv5cmYtKaatMaSN5hA7jbJUcm4E7`~~ (废弃，价格 bug)
- ~~旧池子: `HBs5ufwcDnrfcVqNv7Mamkocdnb2mBY11kF7FQyNLSkg`~~ (废弃，liquidity=0)

See `MAINNET_DEPLOY.md` for full deployment report.

## Deployment Cost Estimate

- Program deploy: ~8.69 SOL (rent deposit, recoverable via `solana program close`)
- IDL upload: ~0.15 SOL (recoverable via `anchor idl close`)
- Pool creation: ~0.09 SOL (not recoverable)
- Per position: ~0.006 SOL (recoverable on close) + ~0.072 SOL per TickArray (not recoverable)

## Key Lessons Learned

1. **Cleanup order matters**: Close IDL *before* closing the program. Once the program is closed, `anchor idl close` fails and the IDL rent (~0.15 SOL) is permanently locked.
2. **Correct close order**: Remove liquidity → Close positions → Close IDL → Close program
3. **Token-2022 NFTs**: `closePosition` requires `TOKEN_2022_PROGRAM_ID` (not `TOKEN_PROGRAM_ID`) for the token_program parameter.
4. **PDA accounts cannot be reclaimed** after program close (PoolState, AmmConfig, TickArray, ObservationState, etc.) — they are considered permanent infrastructure.
5. **RefCell double-borrow in swap**: When passing tick arrays in `remainingAccounts` for `swapV2`, deduplicate to avoid passing the same PDA twice (causes `RefCell already mutably borrowed` panic).

## Contract Architecture Quick Reference

### Key Account Types & PDA Seeds

- **AmmConfig**: `["amm_config", index.to_be_bytes()]` — fee rate configuration
- **PoolState**: `["pool", amm_config, token_mint_0, token_mint_1]` — pool state
- **TokenVault**: `["pool_vault", pool_state, token_mint]` — token vaults
- **PersonalPosition**: `["position", nft_mint]` — user LP position
- **TickArray**: `["tick_array", pool_state, start_tick_index.to_be_bytes()]` — tick data (60 ticks each)
- **ObservationState**: `["observation", pool_state]` — oracle data
- **TickArrayBitmapExtension**: `["pool_tick_array_bitmap_extension", pool_state]`

### Main Instructions

- **Admin**: `createAmmConfig`, `updateAmmConfig`, `updatePoolStatus`, `collectProtocolFee`, `collectFundFee`
- **Pool**: `createPool`
- **Position**: `openPositionV2`, `closePosition`, `increaseLiquidityV2`, `decreaseLiquidityV2`
- **Swap**: `swapV2`, `swapRouterBaseIn`
- **Reward**: `initializeReward`, `setRewardParams`, `collectRemainingRewards`

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/create-amm-config.ts` | Create AmmConfig with zero protocol/fund fees |
| `scripts/create-pool.ts` | Create a pool (derives PDAs, initializes tick arrays & observation) |
| `scripts/decode-pool.ts` | Decode and display on-chain pool state |
| `scripts/test-fork-behavior.ts` | Verify zero-fee enforcement (non-zero fees should fail) |
| `scripts/test-swap.ts` | End-to-end swap test |
| `scripts/test-swap-detailed.ts` | Detailed swap test with fee breakdown |

Run with:
```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
pnpm tsx scripts/<script-name>.ts
```

## Known Issue

- Swap test has an unresolved **RefCell borrow bug** in local validator context.
