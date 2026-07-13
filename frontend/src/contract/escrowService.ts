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
import { Client as ReputationClientCtor } from '../bindings/runner-reputation'
import type { ClientOptions } from '@stellar/stellar-sdk/contract'

// Native XLM token SAC address on testnet
export const NATIVE_TOKEN = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'

const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'
const RPC_URL            = 'https://soroban-testnet.stellar.org'
const CONTRACT_ID        = 'CAB5LP5SKD22NA6SECD6EV3AJ62BWYV5MNRRELCHVKF5DX6IUQADSXBB'
const REPUTATION_ID      = 'CBYNRRNW7RE5WJXJSNGPY45SAWTXU6GWGQ42PJSV4VT35MK6PIHXNJTK'
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
 * Titiper confirms delivery → contract releases XLM to runner AND records the
 * runner's star rating in one transaction. `rating` is 1–5, or 0 to skip.
 * The rating never blocks the payout — it's recorded alongside it.
 * Freighter opens for the user to approve.
 */
export async function confirmReceiptOnChain(
  titiperAddress: string,
  requestId:      string,
  rating:         number = 0,
): Promise<void> {
  const client = buildClient(titiperAddress)

  const tx = await client.confirm_receipt({
    request_id: requestId,
    titiper:    titiperAddress,
    rating,
  })

  await tx.signAndSend()
}

/** A runner's on-chain reputation, derived from the reputation contract. */
export interface RunnerReputation {
  completed:     number // escrows paid out
  refunded:      number // escrows refunded (item unavailable)
  ratingCount:   number // number of star ratings received
  averageRating: number // mean stars (0 if never rated), 1 decimal
  reliability:   number // completed / (completed + refunded), 0–100 (100 if no history)
}

/**
 * Read a runner's reputation from the reputation contract. Read-only — this is
 * a simulation, so no wallet signature or fee is required. `viewerAddress` just
 * supplies a source account for the simulation.
 */
export async function getRunnerStats(
  runnerAddress: string,
  viewerAddress: string,
): Promise<RunnerReputation> {
  const client = new ReputationClientCtor({
    contractId:        REPUTATION_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl:            RPC_URL,
    publicKey:         viewerAddress,
  } as ClientOptions)

  const { result } = await client.get_stats({ runner: runnerAddress })

  const completed   = Number(result.completed)
  const refunded    = Number(result.refunded)
  const ratingCount = Number(result.rating_count)
  const ratingSum   = Number(result.rating_sum)
  const total       = completed + refunded

  return {
    completed,
    refunded,
    ratingCount,
    averageRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
    reliability:   total > 0 ? Math.round((completed / total) * 100) : 100,
  }
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
