#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Env, String};

#[contract]
pub struct FundContract;

// ── string-building helpers (no_std, no alloc) ──────────────────────────────

/// Append a byte literal into `buf` starting at `*pos`.
fn append_bytes(buf: &mut [u8], pos: &mut usize, s: &[u8]) {
    let end = *pos + s.len();
    buf[*pos..end].copy_from_slice(s);
    *pos = end;
}

/// Write the decimal representation of `n` into `buf` at `*pos`.
fn append_i128(buf: &mut [u8], pos: &mut usize, mut n: i128) {
    if n == 0 {
        buf[*pos] = b'0';
        *pos += 1;
        return;
    }

    let neg = n < 0;
    if neg {
        n = n.wrapping_neg(); // safe for all values except i128::MIN
    }

    let start = *pos;
    while n > 0 {
        buf[*pos] = b'0' + (n % 10) as u8;
        n /= 10;
        *pos += 1;
    }
    if neg {
        buf[*pos] = b'-';
        *pos += 1;
    }

    // Digits were written in reverse order — flip them
    buf[start..*pos].reverse();
}

// ── contract ─────────────────────────────────────────────────────────────────

#[contractimpl]
impl FundContract {
    /// Deposit `amount` stroops of `token_addr` from `user` into this contract.
    ///
    /// Returns: `"Funded {amount} stroops. Balance: {new_balance} stroops"`
    pub fn fund(env: Env, user: Address, token_addr: Address, amount: i128) -> String {
        user.require_auth();

        // Transfer tokens from user → contract
        token::Client::new(&env, &token_addr)
            .transfer(&user, &env.current_contract_address(), &amount);

        // Update balance in persistent storage
        let prev: i128 = env.storage().persistent().get(&user).unwrap_or(0);
        let new_balance = prev + amount;
        env.storage().persistent().set(&user, &new_balance);

        // Keep the entry alive for ≥ 100 ledgers
        env.storage().persistent().extend_ttl(&user, 100, 100);

        // Build return string on the stack
        let mut buf = [0u8; 256];
        let mut pos = 0usize;
        append_bytes(&mut buf, &mut pos, b"Funded ");
        append_i128(&mut buf, &mut pos, amount);
        append_bytes(&mut buf, &mut pos, b" stroops. Balance: ");
        append_i128(&mut buf, &mut pos, new_balance);
        append_bytes(&mut buf, &mut pos, b" stroops");

        String::from_bytes(&env, &buf[..pos])
    }

    /// Return the deposited balance for `user` as a human-readable string.
    ///
    /// Returns: `"Balance: {balance} stroops"`
    pub fn balance(env: Env, user: Address) -> String {
        let bal: i128 = env.storage().persistent().get(&user).unwrap_or(0);

        let mut buf = [0u8; 64];
        let mut pos = 0usize;
        append_bytes(&mut buf, &mut pos, b"Balance: ");
        append_i128(&mut buf, &mut pos, bal);
        append_bytes(&mut buf, &mut pos, b" stroops");

        String::from_bytes(&env, &buf[..pos])
    }
}

mod test;
