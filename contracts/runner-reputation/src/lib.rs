#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct RunnerStats {
    pub completed:    u32, // number of escrows completed (runner paid out)
    pub refunded:     u32, // number of escrows refunded (item unavailable)
    pub rating_sum:   u64, // sum of all star ratings (1..=5) the runner received
    pub rating_count: u32, // number of ratings that make up rating_sum
}

impl RunnerStats {
    fn empty() -> Self {
        RunnerStats { completed: 0, refunded: 0, rating_sum: 0, rating_count: 0 }
    }
}

#[contracttype]
pub enum DataKey {
    Stats(Address),
    Admin, // admin address for upgrades
}

#[contract]
pub struct RunnerReputation;

#[contractimpl]
impl RunnerReputation {
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

    /// Called by the escrow contract when a titiper confirms receipt.
    /// `rating` is a 1..=5 star score; 0 means the titiper skipped rating
    /// (e.g. permissionless auto-release), and out-of-range values are ignored.
    /// A completion is always counted regardless of whether a rating was given.
    pub fn record_completed(env: Env, runner: Address, rating: u32) {
        let key = DataKey::Stats(runner);
        let mut stats: RunnerStats = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(RunnerStats::empty);
        stats.completed += 1;
        if rating >= 1 && rating <= 5 {
            stats.rating_sum += rating as u64;
            stats.rating_count += 1;
        }
        env.storage().persistent().set(&key, &stats);
        env.storage().persistent().extend_ttl(&key, 518_400, 518_400);
    }

    /// Called by the escrow contract when a runner issues a refund.
    pub fn record_refunded(env: Env, runner: Address) {
        let key = DataKey::Stats(runner);
        let mut stats: RunnerStats = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(RunnerStats::empty);
        stats.refunded += 1;
        env.storage().persistent().set(&key, &stats);
        env.storage().persistent().extend_ttl(&key, 518_400, 518_400);
    }

    /// Returns completed/refunded counts and rating totals for a runner.
    /// Returns zeros if no history. Average rating = rating_sum / rating_count
    /// (computed by the caller to avoid on-chain fixed-point).
    pub fn get_stats(env: Env, runner: Address) -> RunnerStats {
        let key = DataKey::Stats(runner);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(RunnerStats::empty)
    }
}

mod test;
