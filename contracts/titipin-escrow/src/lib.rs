#![no_std]
use soroban_sdk::{
    contract, contractclient, contractimpl, contracttype,
    token, Address, BytesN, Env, String,
};

// Interface for the runner-reputation contract — used for cross-contract calls.
#[contractclient(name = "ReputationClient")]
pub trait ReputationInterface {
    fn record_completed(env: Env, runner: Address);
    fn record_refunded(env: Env, runner: Address);
}

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
    pub runner:     Address,
    pub titiper:    Address,
    pub token:      Address, // XLM or USDC SAC address
    pub amount:     i128,    // in stroops (1 XLM = 10_000_000)
    pub status:     EscrowStatus,
    pub funded_at:  u64,     // ledger timestamp when funded (0 if not yet funded)
}

#[contracttype]
pub enum DataKey {
    Request(String),    // keyed by request_id
    Admin,              // admin address for upgrades
    ReputationContract, // optional cross-contract reputation tracker
}

// Titiper can reclaim funds if runner ghosts for 30 days (~2,592,000 seconds)
const REFUND_TIMEOUT_SECS: u64 = 30 * 24 * 60 * 60;

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct TitipinEscrow;

#[contractimpl]
impl TitipinEscrow {
    /// Call once after deploy to register the admin address.
    /// Admin is the only one who can upgrade the contract WASM.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Upgrade the contract WASM in-place (same contract ID, new logic).
    /// Only the admin set in initialize() can call this.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("not initialized"));

        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    /// Admin registers the reputation contract address for cross-contract calls.
    pub fn set_reputation_contract(env: Env, reputation_id: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("not initialized"));
        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::ReputationContract, &reputation_id);
    }

    /// Runner registers an escrow request after approving the titiper's item.
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
                status:    EscrowStatus::Registered,
                funded_at: 0,
            },
        );
        env.storage().persistent().extend_ttl(&key, 518_400, 518_400);
    }

    /// Titiper locks funds into this contract.
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

        token::Client::new(&env, &req.token)
            .transfer(&titiper, &env.current_contract_address(), &req.amount);

        req.status    = EscrowStatus::Funded;
        req.funded_at = env.ledger().timestamp();

        env.storage().persistent().set(&key, &req);
        env.storage().persistent().extend_ttl(&key, 518_400, 518_400);
    }

    /// Titiper confirms receipt — releases funds to runner.
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

        token::Client::new(&env, &req.token)
            .transfer(&env.current_contract_address(), &req.runner, &req.amount);

        req.status = EscrowStatus::Completed;
        env.storage().persistent().set(&key, &req);

        // Cross-contract call: update runner's reputation score
        if let Some(rep_id) = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::ReputationContract)
        {
            ReputationClient::new(&env, &rep_id).record_completed(&req.runner);
        }

        String::from_str(&env, "Payment released to runner")
    }

    /// Runner marks item unavailable — refunds titiper.
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
        match req.status {
            EscrowStatus::Registered | EscrowStatus::Funded => {}
            _ => panic!("request is already completed or refunded"),
        }

        if req.status == EscrowStatus::Funded {
            token::Client::new(&env, &req.token)
                .transfer(&env.current_contract_address(), &req.titiper, &req.amount);
        }

        req.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&key, &req);

        // Cross-contract call: record refund in runner's reputation
        if let Some(rep_id) = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::ReputationContract)
        {
            ReputationClient::new(&env, &rep_id).record_refunded(&req.runner);
        }

        String::from_str(&env, "Funds refunded to titiper")
    }

    /// Escape hatch: titiper reclaims funds if runner ghosts for 30 days.
    /// Protects titipers from runners who disappear after escrow is funded.
    pub fn claim_timeout_refund(env: Env, request_id: String, titiper: Address) -> String {
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
            panic!("funds are not currently in escrow");
        }

        let now = env.ledger().timestamp();
        if now < req.funded_at + REFUND_TIMEOUT_SECS {
            panic!("timeout period has not elapsed yet (30 days required)");
        }

        token::Client::new(&env, &req.token)
            .transfer(&env.current_contract_address(), &req.titiper, &req.amount);

        req.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&key, &req);

        String::from_str(&env, "Timeout refund claimed by titiper")
    }

    /// Read-only: current on-chain state of a request.
    pub fn get_request(env: Env, request_id: String) -> EscrowRequest {
        let key = DataKey::Request(request_id);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("request not found"))
    }
}

mod test;
