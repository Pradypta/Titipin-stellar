# Titipin

> ⚠️ **This project is still under active development. Features, contracts, and interfaces are subject to change at any time without prior notice.**

Titipin is a **Stellar-powered escrow payment platform** built for jastip, pre-orders, and other delayed-fulfillment transactions in informal social commerce.

Instead of sending money directly to a seller, buyers lock their funds in a smart contract escrow while the jastiper sources and fulfills the order. Payment is only released when the item is successfully purchased and delivered. If the order cannot be fulfilled — such as when an item is sold out or unavailable — the funds are **automatically refunded** to the buyer.

Titipin creates a safer, more transparent payment flow for both buyers and sellers.

---

## The Problem

In jastip and informal pre-order transactions, buyers typically transfer money upfront with no guarantee:

- The seller might not find the item
- The item might be sold out or unavailable
- Refunds depend entirely on the seller's honesty

There is no neutral party holding the funds, and disputes are resolved informally — or not at all.

## The Solution

Titipin uses **Soroban smart contracts on Stellar** to act as a neutral escrow:

```
Buyer locks funds
      │
      ▼
  Escrow Contract (on Stellar)
      │
      ├── Item fulfilled → funds released to seller
      │
      └── Item unavailable → funds automatically refunded to buyer
```

Neither party can touch the funds unilaterally. The contract enforces the rules.

---

## Contracts

### `xlm-fund` *(current — foundation layer)*

The current contract is a deposit vault that demonstrates the core funding and balance-tracking mechanics that the full escrow system will be built on.

- **`fund(user, token_addr, amount)`** — Locks XLM from a user's wallet into the contract and records the deposit. Returns a confirmation string:
  ```
  "Funded 10000000 stroops. Balance: 10000000 stroops"
  ```

- **`balance(user)`** — Returns the user's currently locked balance as a string:
  ```
  "Balance: 10000000 stroops"
  ```

> **Stroops:** Stellar's smallest unit. 1 XLM = 10,000,000 stroops.

See [`contracts/xlm-fund/README.md`](contracts/xlm-fund/README.md) for full build, deploy, and usage instructions.

---

## Project Structure

```
.
├── contracts/
│   ├── hello-world/        # Starter example contract
│   └── xlm-fund/           # Deposit vault (foundation layer)
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
- [Node.js](https://nodejs.org/) (for the frontend)

```bash
cargo install --locked stellar-cli --features opt
rustup target add wasm32-unknown-unknown
```

**Build contracts**

```bash
stellar contract build -p xlm-fund
```

**Run tests**

```bash
cargo test -p xlm-fund
```

---

## Roadmap

> Everything below is planned and subject to change.

- [ ] Full escrow contract — lock, release, and refund flows
- [ ] Multi-party dispute resolution
- [ ] Order status tracking on-chain
- [ ] Frontend UI for buyers and jastipers
- [ ] Freighter wallet integration
- [ ] Testnet deployment

---

## Built with

- [Soroban SDK v26](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar Testnet](https://developers.stellar.org/docs/learn/fundamentals/networks)
- [Rust](https://www.rust-lang.org/)
