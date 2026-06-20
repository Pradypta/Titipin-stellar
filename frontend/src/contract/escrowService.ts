/**
 * Titipin escrow service — wired to the deployed Soroban contract.
 *
 * Contract: CB4YBYZMZITNAGE2U3LCA3WPUHGXJGWVZ7Z2PKB3S3ZUBPUVXZQALEKB (testnet)
 *
 * Flow:
 *  1. Runner approves  → createEscrowRequest()   registers terms on-chain
 *  2. Titiper funds    → fundEscrow()             locks XLM in contract
 *  3. Titiper confirms → confirmReceiptOnChain()  releases XLM to runner
 *  4. Runner refunds   → refundTitiperOnChain()   returns XLM to titiper
 */

import { signTransaction as freighterSign } from '@stellar/freighter-api'
import { Client } from '../bindings/titipin-escrow'
import type { ClientOptions } from '@stellar/stellar-sdk/contract'

// Native XLM token SAC address on testnet
export const NATIVE_TOKEN = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'

const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'
const RPC_URL            = 'https://soroban-testnet.stellar.org'
const CONTRACT_ID        = 'CB4YBYZMZITNAGE2U3LCA3WPUHGXJGWVZ7Z2PKB3S3ZUBPUVXZQALEKB'
const STROOPS_PER_XLM    = 10_000_000

function buildClient(walletAddress: string): Client {
  return new Client({
    contractId:         CONTRACT_ID,
    networkPassphrase:  NETWORK_PASSPHRASE,
    rpcUrl:             RPC_URL,
    publicKey:          walletAddress,
    signTransaction: async (xdr: string, opts?: Parameters<NonNullable<ClientOptions['signTransaction']>>[1]) => {
      const result = await freighterSign(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: walletAddress,
        ...opts,
      })
      if (result.error) throw new Error(result.error.message)
      return result
    },
  } as ClientOptions)
}

/**
 * Runner registers the escrow on-chain after approving the request.
 * Must be called before the titiper can fund.
 */
export async function createEscrowRequest(
  runnerAddress:  string,
  requestId:      string,
  titiperAddress: string,
  xlmAmount:      number,
): Promise<void> {
  const client = buildClient(runnerAddress)
  const amountInStroops = BigInt(Math.round(xlmAmount * STROOPS_PER_XLM))

  const tx = await client.create_request({
    request_id: requestId,
    runner:     runnerAddress,
    titiper:    titiperAddress,
    token:      NATIVE_TOKEN,
    amount:     amountInStroops,
  })

  await tx.signAndSend()
}

/**
 * Titiper locks XLM in the contract.
 * Freighter opens for the user to approve.
 * Funds move: titiper wallet → Titipin contract.
 */
export async function fundEscrow(
  titiperAddress: string,
  requestId:      string,
): Promise<void> {
  const client = buildClient(titiperAddress)

  const tx = await client.fund_request({
    request_id: requestId,
    titiper:    titiperAddress,
  })

  await tx.signAndSend()
}

/**
 * Titiper confirms delivery → contract automatically releases XLM to runner.
 * Freighter opens for the user to approve.
 */
export async function confirmReceiptOnChain(
  titiperAddress: string,
  requestId:      string,
): Promise<void> {
  const client = buildClient(titiperAddress)

  const tx = await client.confirm_receipt({
    request_id: requestId,
    titiper:    titiperAddress,
  })

  await tx.signAndSend()
}

/**
 * Runner marks item unavailable → contract automatically refunds titiper.
 * Freighter opens for the runner to approve.
 */
export async function refundTitiperOnChain(
  runnerAddress: string,
  requestId:     string,
): Promise<void> {
  const client = buildClient(runnerAddress)

  const tx = await client.refund_request({
    request_id: requestId,
    runner:     runnerAddress,
  })

  await tx.signAndSend()
}
