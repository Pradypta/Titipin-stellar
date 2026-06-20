#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token, Address, Env,
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
fn test_fund_and_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(FundContract, ());

    let (token, token_admin) = create_token(&env, &admin);

    // Mint 1_000_000 stroops to the user
    token_admin.mint(&user, &1_000_000);
    assert_eq!(token.balance(&user), 1_000_000);

    let client = FundContractClient::new(&env, &contract_id);

    // Deposit 500_000 stroops
    let msg = client.fund(&user, &token.address, &500_000);
    assert_eq!(
        msg,
        soroban_sdk::String::from_str(&env, "Funded 500000 stroops. Balance: 500000 stroops")
    );
    assert_eq!(token.balance(&user), 500_000);
    assert_eq!(token.balance(&contract_id), 500_000);

    // Check balance via balance()
    let bal_msg = client.balance(&user);
    assert_eq!(
        bal_msg,
        soroban_sdk::String::from_str(&env, "Balance: 500000 stroops")
    );

    // Deposit another 200_000 stroops
    let msg2 = client.fund(&user, &token.address, &200_000);
    assert_eq!(
        msg2,
        soroban_sdk::String::from_str(&env, "Funded 200000 stroops. Balance: 700000 stroops")
    );

    // Verify zero-balance user
    let stranger = Address::generate(&env);
    let zero_msg = client.balance(&stranger);
    assert_eq!(
        zero_msg,
        soroban_sdk::String::from_str(&env, "Balance: 0 stroops")
    );
}
