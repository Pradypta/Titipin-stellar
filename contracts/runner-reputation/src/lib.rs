#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct RunnerStats {
    pub completed: u32, // number of escrows completed (runner paid out)
    pub refunded:  u32, // number of escrows refunded (item unavailable)
}

#[contracttype]
pub enum DataKey {
    Stats(Address),
}

#[contract]
pub struct RunnerReputation;

#[contractimpl]
impl RunnerReputation {
    /// Called by the escrow contract when a titiper confirms receipt.
    pub fn record_completed(env: Env, runner: Address) {
        let key = DataKey::Stats(runner);
        let mut stats: RunnerStats = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(RunnerStats { completed: 0, refunded: 0 });
        stats.completed += 1;
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
            .unwrap_or(RunnerStats { completed: 0, refunded: 0 });
        stats.refunded += 1;
        env.storage().persistent().set(&key, &stats);
        env.storage().persistent().extend_ttl(&key, 518_400, 518_400);
    }

    /// Returns completed and refunded counts for a runner. Returns zeros if no history.
    pub fn get_stats(env: Env, runner: Address) -> RunnerStats {
        let key = DataKey::Stats(runner);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(RunnerStats { completed: 0, refunded: 0 })
    }
}

mod test;
