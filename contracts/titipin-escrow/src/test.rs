#![cfg(test)]

use super::*;
use runner_reputation::{RunnerReputation, RunnerReputationClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, Address, Env, String,
};
use token::Client as TokenClient;
use token::StellarAssetClient as StellarAssetTokenClient;

fn create_token<'a>(
    env: &Env,
    admin: &Address,
) -> (TokenClient<'a>, StellarAssetTokenClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    (
        TokenClient::new(env, &sac.address()),
        StellarAssetTokenClient::new(env, &sac.address()),
    )
}

#[test]
fn test_confirm_receipt_releases_funds_to_runner() {
    let env = Env::default();
    env.mock_all_auths();

    let admin   = Address::generate(&env);
    let runner  = Address::generate(&env);
    let titiper = Address::generate(&env);
    let contract_id = env.register(TitipinEscrow, ());

    let (token, token_admin) = create_token(&env, &admin);

    // Give titiper 500 XLM (in stroops: 500 * 10_000_000)
    let amount: i128 = 130_0000000; // 130 XLM
    token_admin.mint(&titiper, &(amount + 50_0000000));

    let client = TitipinEscrowClient::new(&env, &contract_id);
    let req_id = String::from_str(&env, "req-001");

    // Step 1: Runner registers the escrow
    client.create_request(&req_id, &runner, &titiper, &token.address, &amount);

    // Step 2: Titiper funds escrow
    client.fund_request(&req_id, &titiper);
    assert_eq!(token.balance(&titiper), 50_0000000);
    assert_eq!(token.balance(&contract_id), amount);

    // Step 3: Titiper confirms receipt (5★) → runner gets paid
    let msg = client.confirm_receipt(&req_id, &titiper, &5);
    assert_eq!(token.balance(&runner), amount);
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(
        msg,
        String::from_str(&env, "Payment released to runner")
    );

    // State check
    let req = client.get_request(&req_id);
    assert_eq!(req.status, EscrowStatus::Completed);
}

#[test]
fn test_refund_path() {
    let env = Env::default();
    env.mock_all_auths();

    let admin   = Address::generate(&env);
    let runner  = Address::generate(&env);
    let titiper = Address::generate(&env);
    let contract_id = env.register(TitipinEscrow, ());

    let (token, token_admin) = create_token(&env, &admin);

    let amount: i128 = 100_0000000; // 100 XLM
    token_admin.mint(&titiper, &amount);

    let client = TitipinEscrowClient::new(&env, &contract_id);
    let req_id = String::from_str(&env, "req-002");

    // Register → Fund → Runner refunds (item unavailable)
    client.create_request(&req_id, &runner, &titiper, &token.address, &amount);
    client.fund_request(&req_id, &titiper);

    assert_eq!(token.balance(&titiper), 0);
    assert_eq!(token.balance(&contract_id), amount);

    let msg = client.refund_request(&req_id, &runner);
    assert_eq!(token.balance(&titiper), amount); // full refund
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(
        msg,
        String::from_str(&env, "Funds refunded to titiper")
    );

    let req = client.get_request(&req_id);
    assert_eq!(req.status, EscrowStatus::Refunded);
}

#[test]
fn test_timeout_refund_path() {
    let env = Env::default();
    env.mock_all_auths();

    let admin   = Address::generate(&env);
    let runner  = Address::generate(&env);
    let titiper = Address::generate(&env);
    let contract_id = env.register(TitipinEscrow, ());

    let (token, token_admin) = create_token(&env, &admin);

    let amount: i128 = 100_0000000; // 100 XLM
    token_admin.mint(&titiper, &amount);

    let client = TitipinEscrowClient::new(&env, &contract_id);
    let req_id = String::from_str(&env, "req-003");

    // Register → Fund
    client.create_request(&req_id, &runner, &titiper, &token.address, &amount);
    client.fund_request(&req_id, &titiper);

    assert_eq!(token.balance(&titiper), 0);
    assert_eq!(token.balance(&contract_id), amount);

    // Simulate 31 days passing (runner ghosted)
    let thirty_one_days: u64 = 31 * 24 * 60 * 60;
    env.ledger().set_timestamp(env.ledger().timestamp() + thirty_one_days);

    // Titiper reclaims funds after timeout
    let msg = client.claim_timeout_refund(&req_id, &titiper);
    assert_eq!(token.balance(&titiper), amount); // full refund
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(
        msg,
        String::from_str(&env, "Timeout refund claimed by titiper")
    );

    let req = client.get_request(&req_id);
    assert_eq!(req.status, EscrowStatus::Refunded);
}

#[test]
fn test_auto_release_to_runner_after_72h() {
    let env = Env::default();
    env.mock_all_auths();

    let admin   = Address::generate(&env);
    let runner  = Address::generate(&env);
    let titiper = Address::generate(&env);
    let contract_id = env.register(TitipinEscrow, ());

    let (token, token_admin) = create_token(&env, &admin);

    let amount: i128 = 130_0000000; // 130 XLM
    token_admin.mint(&titiper, &amount);

    let client = TitipinEscrowClient::new(&env, &contract_id);
    let req_id = String::from_str(&env, "req-005");

    // admin is the courier oracle allowed to mark deliveries
    client.initialize(&admin);

    // Register → Fund → Ship → Deliver
    client.create_request(&req_id, &runner, &titiper, &token.address, &amount);
    client.fund_request(&req_id, &titiper);

    let tracking = String::from_str(&env, "EMS-JP-123456789");
    client.mark_shipped(&req_id, &runner, &tracking);

    let req = client.get_request(&req_id);
    assert_eq!(req.status, EscrowStatus::Shipped);
    assert_eq!(req.tracking, tracking);

    client.mark_delivered(&req_id);
    assert_eq!(client.get_request(&req_id).status, EscrowStatus::Delivered);

    // 72h pass with no confirmation from the titiper
    let seventy_two_hours: u64 = 72 * 60 * 60;
    env.ledger().set_timestamp(env.ledger().timestamp() + seventy_two_hours);

    // A keeper (anyone) triggers the auto-release → runner gets paid
    let msg = client.claim_auto_release(&req_id);
    assert_eq!(token.balance(&runner), amount);
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(msg, String::from_str(&env, "Funds auto-released to runner"));
    assert_eq!(client.get_request(&req_id).status, EscrowStatus::Completed);
}

#[test]
#[should_panic(expected = "auto-release window has not elapsed yet")]
fn test_auto_release_rejected_before_72h() {
    let env = Env::default();
    env.mock_all_auths();

    let admin   = Address::generate(&env);
    let runner  = Address::generate(&env);
    let titiper = Address::generate(&env);
    let contract_id = env.register(TitipinEscrow, ());

    let (token, token_admin) = create_token(&env, &admin);

    let amount: i128 = 100_0000000;
    token_admin.mint(&titiper, &amount);

    let client = TitipinEscrowClient::new(&env, &contract_id);
    let req_id = String::from_str(&env, "req-006");

    client.initialize(&admin);
    client.create_request(&req_id, &runner, &titiper, &token.address, &amount);
    client.fund_request(&req_id, &titiper);
    client.mark_shipped(&req_id, &runner, &String::from_str(&env, "EMS-JP-987"));
    client.mark_delivered(&req_id);

    // Only 71 hours have passed — auto-release must be rejected.
    let seventy_one_hours: u64 = 71 * 60 * 60;
    env.ledger().set_timestamp(env.ledger().timestamp() + seventy_one_hours);
    client.claim_auto_release(&req_id);
}

#[test]
fn test_reputation_updated_on_escrow_completion() {
    let env = Env::default();
    env.mock_all_auths();

    let admin   = Address::generate(&env);
    let runner  = Address::generate(&env);
    let titiper = Address::generate(&env);

    // Deploy both contracts
    let escrow_id     = env.register(TitipinEscrow, ());
    let reputation_id = env.register(RunnerReputation, ());

    let (token, token_admin) = create_token(&env, &admin);

    let amount: i128 = 100_0000000;
    token_admin.mint(&titiper, &amount);

    let escrow     = TitipinEscrowClient::new(&env, &escrow_id);
    let reputation = RunnerReputationClient::new(&env, &reputation_id);
    let req_id     = String::from_str(&env, "req-004");

    // Wire escrow to reputation, then run the full flow
    escrow.initialize(&admin);
    escrow.set_reputation_contract(&reputation_id);

    assert_eq!(reputation.get_stats(&runner).completed, 0);
    assert_eq!(reputation.get_stats(&runner).refunded, 0);

    escrow.create_request(&req_id, &runner, &titiper, &token.address, &amount);
    escrow.fund_request(&req_id, &titiper);
    escrow.confirm_receipt(&req_id, &titiper, &4);

    // Escrow called reputation contract — completed count and the 4★ rating
    // must both be recorded.
    let stats = reputation.get_stats(&runner);
    assert_eq!(stats.completed, 1);
    assert_eq!(stats.refunded, 0);
    assert_eq!(stats.rating_sum, 4);
    assert_eq!(stats.rating_count, 1);
}
