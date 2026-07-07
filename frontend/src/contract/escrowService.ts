/**
 * Titipin escrow service — wired to the deployed Soroban contract.
 *
 * Contract: CAB5LP5SKD22NA6SECD6EV3AJ62BWYV5MNRRELCHVKF5DX6IUQADSXBB (testnet)
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
const CONTRACT_ID        = 'CAB5LP5SKD22NA6SECD6EV3AJ62BWYV5MNRRELCHVKF5DX6IUQADSXBB'
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

/**
 * Runner marks the item purchased + shipped and records the EMS tracking
 * number on-chain. Moves the escrow Funded → Shipped.
 * Freighter opens for the runner to approve.
 */
export async function markShippedOnChain(
  runnerAddress: string,
  requestId:     string,
  trackingNumber: string,
): Promise<void> {
  const client = buildClient(runnerAddress)

  const tx = await client.mark_shipped({
    request_id: requestId,
    runner:     runnerAddress,
    tracking:   trackingNumber,
  })

  await tx.signAndSend()
}

/**
 * Courier oracle (admin/backend key) confirms delivery, moving the escrow
 * Shipped → Delivered and starting the 72h auto-release clock.
 * The signer must be the admin address registered via initialize().
 */
export async function markDeliveredOnChain(
  adminAddress: string,
  requestId:    string,
): Promise<void> {
  const client = buildClient(adminAddress)

  const tx = await client.mark_delivered({
    request_id: requestId,
  })

  await tx.signAndSend()
}

/**
 * Permissionless auto-release: once 72h have passed since delivery and the
 * titiper never confirmed, anyone (a keeper) can trigger payout to the runner.
 * `callerAddress` just pays the transaction fee — funds only ever go to the
 * pre-agreed runner.
 */
export async function claimAutoReleaseOnChain(
  callerAddress: string,
  requestId:     string,
): Promise<void> {
  const client = buildClient(callerAddress)

  const tx = await client.claim_auto_release({
    request_id: requestId,
  })

  await tx.signAndSend()
}
