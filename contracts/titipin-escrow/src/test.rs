#![cfg(test)]

use super::*;
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
fn test_full_happy_path() {
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

    // Step 3: Titiper confirms receipt → runner gets paid
    let msg = client.confirm_receipt(&req_id, &titiper);
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
