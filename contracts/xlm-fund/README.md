# XLM Fund — Soroban Smart Contract

A simple deposit vault on the Stellar blockchain. Users submit XLM into the contract and can check their accumulated balance at any time. Every function returns a plain string so the result is easy to read in any client.

---

## What it does

| Function | What happens |
|---|---|
| `fund(user, token_addr, amount)` | Transfers XLM from the user's wallet into the contract and records the deposit |
| `balance(user)` | Reads and returns the user's total deposited amount |

### Example output

```
fund()    → "Funded 10000000 stroops. Balance: 10000000 stroops"
balance() → "Balance: 10000000 stroops"
```

> **Note:** Stellar uses **stroops** as its smallest unit. 1 XLM = 10,000,000 stroops.

---

## How it works

```
User wallet
    │
    │  calls fund()
    ▼
FundContract
    ├── requires user signature (require_auth)
    ├── pulls XLM from user → contract via token.transfer()
    ├── adds amount to user's running total in persistent storage
    └── returns confirmation string
```

1. The user signs the transaction — the contract enforces this with `require_auth`, so nobody can deposit on someone else's behalf without their signature.
2. The XLM moves on-chain from the user's wallet to the contract's address using Stellar's native token interface.
3. The contract stores each user's running total in **persistent storage**, keyed by their wallet address.
4. The storage entry is kept alive by extending its TTL (time-to-live) on every deposit.

---

## Project structure

```
contracts/xlm-fund/
├── src/
│   ├── lib.rs      # Contract logic
│   └── test.rs     # Unit tests
└── Cargo.toml
```

---

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)

```bash
cargo install --locked stellar-cli --features opt
rustup target add wasm32-unknown-unknown
```

---

## Build

```bash
stellar contract build -p xlm-fund
```

The compiled WASM will be at:
```
target/wasm32-unknown-unknown/release/xlm_fund.wasm
```

---

## Test

```bash
cargo test -p xlm-fund
```

---

## Deploy to testnet

**1. Create and fund a testnet identity**

```bash
stellar keys generate --global alice --network testnet --fund
```

**2. Deploy the contract**

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/xlm_fund.wasm \
  --source alice \
  --network testnet
```

Save the contract ID printed in the output — you will need it for every invoke call.

**3. Get the native XLM token address on testnet**

```bash
stellar contract id asset \
  --asset native \
  --network testnet
```

This returns the Stellar Asset Contract (SAC) address for native XLM, e.g. `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`.

---

## Usage

### Deposit XLM

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source alice \
  --network testnet \
  -- fund \
    --user <YOUR_WALLET_ADDRESS> \
    --token_addr <NATIVE_XLM_SAC_ADDRESS> \
    --amount 10000000
```

**Output:**
```
"Funded 10000000 stroops. Balance: 10000000 stroops"
```

### Check balance

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- balance \
    --user <YOUR_WALLET_ADDRESS>
```

**Output:**
```
"Balance: 10000000 stroops"
```

---

## Stroops reference

| XLM | Stroops |
|---|---|
| 0.1 XLM | 1,000,000 |
| 1 XLM | 10,000,000 |
| 10 XLM | 100,000,000 |
| 100 XLM | 1,000,000,000 |

---

## Built with

- [Soroban SDK v26](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar Testnet](https://developers.stellar.org/docs/learn/fundamentals/networks)
