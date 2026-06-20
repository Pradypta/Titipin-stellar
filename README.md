# Stellar Project 01

A Soroban smart contract project on the Stellar blockchain. This project contains the **XLM Fund** contract — a deposit vault that lets users submit XLM and check their balance, with every action returning a plain string.

---

## Contracts

### `xlm-fund`

A deposit vault where users send XLM into the contract and the contract keeps a running total of how much each user has deposited.

**What it does:**

- **`fund(user, token_addr, amount)`** — The user signs the transaction, the contract pulls the specified amount of XLM from their wallet into the contract's own address, and records the new total in persistent storage. Returns a confirmation string like:
  ```
  "Funded 10000000 stroops. Balance: 10000000 stroops"
  ```

- **`balance(user)`** — Reads the user's total deposited amount from storage and returns it as a string:
  ```
  "Balance: 10000000 stroops"
  ```

> **Stroops:** Stellar's smallest unit. 1 XLM = 10,000,000 stroops.

**How a deposit works under the hood:**

```
User wallet
    │  signs + calls fund()
    ▼
FundContract
    ├── verifies user signature (require_auth)
    ├── transfers XLM: user wallet → contract address
    ├── updates user's running total in persistent storage
    └── returns confirmation string
```

See [`contracts/xlm-fund/README.md`](contracts/xlm-fund/README.md) for full build, deploy, and usage instructions.

---

## Project Structure

```
.
├── contracts/
│   ├── hello-world/        # Starter example contract
│   └── xlm-fund/           # XLM deposit vault contract
│       ├── src/
│       │   ├── lib.rs      # Contract logic
│       │   └── test.rs     # Unit tests
│       ├── Cargo.toml
│       └── README.md
├── Cargo.toml
└── README.md
```

---

## Getting Started

**Prerequisites**

- [Rust](https://www.rust-lang.org/tools/install)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)

```bash
cargo install --locked stellar-cli --features opt
rustup target add wasm32-unknown-unknown
```

**Build**

```bash
stellar contract build -p xlm-fund
```

**Test**

```bash
cargo test -p xlm-fund
```

---

## Built with

- [Soroban SDK v26](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar Testnet](https://developers.stellar.org/docs/learn/fundamentals/networks)
