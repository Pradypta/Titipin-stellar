import { useState } from 'react'
import { updateRequestStatus, markRequestShipped } from '../../lib/storage'
import { refundTitiperOnChain } from '../../contract/escrowService'
import { runnerActions } from '../../lib/roles'
import type { TitipRequest } from '../../types/request'

interface Props {
  request: TitipRequest
  walletAddress: string
  onComplete: () => void
}

type ActionKey = 'unavailable' | 'purchased' | 'shipped'

export function RunnerActionBar({ request, walletAddress, onComplete }: Props) {
  // Track WHICH action is loading so only that button shows the spinner
  const [loadingAction, setLoadingAction] = useState<ActionKey | null>(null)
  const [error, setError] = useState('')
  const [tracking, setTracking] = useState('')
  const can = runnerActions(request.requestStatus)

  async function handle(key: ActionKey, action: () => Promise<void>) {
    setLoadingAction(key)
    setError('')
    try {
      await action()
      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setLoadingAction(null)
    }
  }

  const busy = loadingAction !== null

  return (
    <div className="flex flex-wrap gap-2">
      {can.canMarkUnavailable && (
        <button
          disabled={busy}
          onClick={() =>
            handle('unavailable', async () => {
              await refundTitiperOnChain(walletAddress, request.requestId)
              await updateRequestStatus(request.requestId, 'refunded')
            })
          }
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {loadingAction === 'unavailable' ? 'Processing refund…' : '❌ Mark Unavailable & Refund'}
        </button>
      )}

      {can.canMarkPurchased && (
        <button
          disabled={busy}
          onClick={() => handle('purchased', () => updateRequestStatus(request.requestId, 'purchased'))}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loadingAction === 'purchased' ? 'Saving…' : '🛒 Mark Purchased'}
        </button>
      )}

      {can.canMarkShipped && (
        <div className="flex w-full flex-col gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3">
          <label className="text-xs font-medium text-orange-800">
            EMS / Japan Post tracking number
          </label>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. EE123456789JP"
            disabled={busy}
            className="rounded-lg border border-orange-200 px-3 py-1.5 text-sm focus:border-orange-400 focus:outline-none disabled:opacity-50"
          />
          <button
            disabled={busy || tracking.trim() === ''}
            onClick={() =>
              handle('shipped', () =>
                markRequestShipped(request.requestId, tracking.trim()),
              )
            }
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loadingAction === 'shipped' ? 'Saving…' : '📦 Mark Shipped'}
          </button>
        </div>
      )}

      {request.requestStatus === 'shipped' && (
        <div className="w-full rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
          Shipped{request.trackingNumber ? ` · tracking ${request.trackingNumber}` : ''}. Waiting for
          the titiper to confirm delivery.
        </div>
      )}

      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  )
}
