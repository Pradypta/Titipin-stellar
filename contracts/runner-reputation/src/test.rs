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
    assert_eq!(stats.rating_sum, 0);
    assert_eq!(stats.rating_count, 0);

    // Two completions (5★ and 3★), one refund
    client.record_completed(&runner, &5);
    client.record_completed(&runner, &3);
    client.record_refunded(&runner);

    let stats = client.get_stats(&runner);
    assert_eq!(stats.completed, 2);
    assert_eq!(stats.refunded, 1);
    assert_eq!(stats.rating_sum, 8); // 5 + 3
    assert_eq!(stats.rating_count, 2); // average = 4.0
}

#[test]
fn test_zero_rating_counts_completion_but_not_rating() {
    let env = Env::default();
    let contract_id = env.register(RunnerReputation, ());
    let client = RunnerReputationClient::new(&env, &contract_id);

    let runner = Address::generate(&env);

    // rating 0 = titiper skipped (e.g. auto-release): completion still counts,
    // but no rating is recorded so the average is unaffected.
    client.record_completed(&runner, &0);

    let stats = client.get_stats(&runner);
    assert_eq!(stats.completed, 1);
    assert_eq!(stats.rating_sum, 0);
    assert_eq!(stats.rating_count, 0);
}

#[test]
fn test_out_of_range_rating_is_ignored() {
    let env = Env::default();
    let contract_id = env.register(RunnerReputation, ());
    let client = RunnerReputationClient::new(&env, &contract_id);

    let runner = Address::generate(&env);

    // Defensive: a rating above 5 must not pollute the totals.
    client.record_completed(&runner, &9);

    let stats = client.get_stats(&runner);
    assert_eq!(stats.completed, 1);
    assert_eq!(stats.rating_sum, 0);
    assert_eq!(stats.rating_count, 0);
}
