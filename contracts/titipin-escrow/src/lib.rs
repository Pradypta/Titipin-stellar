#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String};

// ── On-chain data types ───────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum EscrowStatus {
    Registered, // runner approved, waiting for titiper payment
    Funded,     // titiper locked funds, runner sourcing
    Completed,  // titiper confirmed receipt, runner paid out
    Refunded,   // item unavailable, titiper refunded
}

#[contracttype]
#[derive(Clone)]
pub struct EscrowRequest {
    pub runner:  Address,
    pub titiper: Address,
    pub token:   Address, // XLM token SAC address
    pub amount:  i128,    // in stroops (1 XLM = 10_000_000 stroops)
    pub status:  EscrowStatus,
}

#[contracttype]
pub enum DataKey {
    Request(String), // keyed by request_id
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct TitipinEscrow;

#[contractimpl]
impl TitipinEscrow {
    /// Runner registers an escrow request after approving the titiper's item.
    /// Locks in the terms: who pays, who receives, how much.
    /// Must be called by the runner before the titiper can fund.
    pub fn create_request(
        env: Env,
        request_id: String,
        runner: Address,
        titiper: Address,
        token: Address,
        amount: i128,
    ) {
        runner.require_auth();

        let key = DataKey::Request(request_id);

        if env.storage().persistent().has(&key) {
            panic!("request already registered on-chain");
        }

        env.storage().persistent().set(
            &key,
            &EscrowRequest {
                runner,
                titiper,
                token,
                amount,
                status: EscrowStatus::Registered,
            },
        );
        env.storage().persistent().extend_ttl(&key, 518_400, 518_400); // ~30 days
    }

    /// Titiper locks XLM into this contract.
    /// Requires Freighter signature from the titiper.
    /// Token is transferred: titiper → contract.
    pub fn fund_request(env: Env, request_id: String, titiper: Address) {
        titiper.require_auth();

        let key = DataKey::Request(request_id);
        let mut req: EscrowRequest = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("request not found"));

        if req.titiper != titiper {
            panic!("unauthorized: caller is not the titiper for this request");
        }
        if req.status != EscrowStatus::Registered {
            panic!("request is not in Registered state");
        }

        // Pull funds from titiper into this contract
        token::Client::new(&env, &req.token)
            .transfer(&titiper, &env.current_contract_address(), &req.amount);

        req.status = EscrowStatus::Funded;
        env.storage().persistent().set(&key, &req);
        env.storage().persistent().extend_ttl(&key, 518_400, 518_400);
    }

    /// Titiper confirms they received the item.
    /// Automatically releases funds: contract → runner.
    /// Only the titiper can call this.
    pub fn confirm_receipt(env: Env, request_id: String, titiper: Address) -> String {
        titiper.require_auth();

        let key = DataKey::Request(request_id);
        let mut req: EscrowRequest = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("request not found"));

        if req.titiper != titiper {
            panic!("unauthorized: caller is not the titiper for this request");
        }
        if req.status != EscrowStatus::Funded {
            panic!("request is not in Funded state");
        }

        // Release funds to runner
        token::Client::new(&env, &req.token)
            .transfer(&env.current_contract_address(), &req.runner, &req.amount);

        req.status = EscrowStatus::Completed;
        env.storage().persistent().set(&key, &req);

        String::from_str(&env, "Payment released to runner")
    }

    /// Runner marks the item as unavailable (sold out, trip canceled, etc).
    /// Automatically refunds funds: contract → titiper.
    /// Only the runner can call this.
    pub fn refund_request(env: Env, request_id: String, runner: Address) -> String {
        runner.require_auth();

        let key = DataKey::Request(request_id);
        let mut req: EscrowRequest = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("request not found"));

        if req.runner != runner {
            panic!("unauthorized: caller is not the runner for this request");
        }

        // Can refund from Registered (before payment) or Funded (after payment)
        match req.status {
            EscrowStatus::Registered | EscrowStatus::Funded => {}
            _ => panic!("request is already completed or refunded"),
        }

        // Only transfer back if titiper had actually locked funds
        if req.status == EscrowStatus::Funded {
            token::Client::new(&env, &req.token)
                .transfer(&env.current_contract_address(), &req.titiper, &req.amount);
        }

        req.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&key, &req);

        String::from_str(&env, "Funds refunded to titiper")
    }

    /// Read the current on-chain state of a request.
    pub fn get_request(env: Env, request_id: String) -> EscrowRequest {
        let key = DataKey::Request(request_id);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("request not found"))
    }
}

mod test;
