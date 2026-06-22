#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_record_and_get_stats() {
    let env = Env::default();
    let contract_id = env.register(RunnerReputation, ());
    let client = RunnerReputationClient::new(&env, &contract_id);

    let runner = Address::generate(&env);

    // Fresh runner starts with zeros
    let stats = client.get_stats(&runner);
    assert_eq!(stats.completed, 0);
    assert_eq!(stats.refunded, 0);

    // Two completions, one refund
    client.record_completed(&runner);
    client.record_completed(&runner);
    client.record_refunded(&runner);

    let stats = client.get_stats(&runner);
    assert_eq!(stats.completed, 2);
    assert_eq!(stats.refunded, 1);
}
