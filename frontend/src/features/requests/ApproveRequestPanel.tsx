import { useState } from 'react'
import { useWallet } from '../../wallet/WalletContext'
import { approveRequest, rejectRequest } from '../../lib/storage'
import { createEscrowRequest } from '../../contract/escrowService'
import type { TitipRequest } from '../../types/request'

interface Props {
  request: TitipRequest
  onComplete: () => void
}

export function ApproveRequestPanel({ request, onComplete }: Props) {
  const { publicKey } = useWallet()
  const [quote, setQuote] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  function handleQuoteChange(val: string) {
    setQuote(val)
    // Clear any lingering error as soon as the user edits the field
    if (error) setError('')
  }

  async function handleApprove() {
    if (!quote || !publicKey) return
    const amount = parseFloat(quote)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }

    setPending(true)
    setError('')
    try {
      await createEscrowRequest(publicKey, request.requestId, request.titiperAddress, amount)
      await approveRequest(request.requestId, amount)
      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed')
    } finally {
      setPending(false)
    }
  }

  async function handleReject() {
    setPending(true)
    try {
      await rejectRequest(request.requestId)
      onComplete()
    } finally {
      setPending(false)
    }
  }

  const previewAmount = quote && !isNaN(parseFloat(quote)) && parseFloat(quote) > 0
    ? parseFloat(quote)
    : null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h4 className="mb-1 font-semibold text-stone-800">Approve Request</h4>

      <div className="mb-3 rounded-lg bg-white p-3 text-sm text-stone-700 border border-stone-100">
        <p><strong>{request.itemName}</strong>{request.variant && ` — ${request.variant}`}</p>
        <p className="text-xs text-stone-400">Qty: {request.quantity}</p>
        {request.notes && <p className="mt-1 text-xs italic text-stone-400">"{request.notes}"</p>}
        {request.estimatedPrice && (
          <p className="mt-1 text-xs text-stone-400">Titiper's estimate: ~{request.estimatedPrice} XLM</p>
        )}
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Your all-in quote (XLM)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={quote}
          onChange={(e) => handleQuoteChange(e.target.value)}
          placeholder="e.g. 130"
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
        />
        <p className="mt-1 text-xs text-stone-400">
          Include everything: item + local tax + import duty + shipping + your margin.
        </p>
      </div>

      {previewAmount && (
        <div className="mb-3 rounded-lg bg-amber-500 p-3 text-white">
          <div className="flex justify-between font-bold">
            <span>Titiper locks in escrow</span>
            <span>{previewAmount.toFixed(2)} XLM</span>
          </div>
          <p className="mt-1 text-xs text-amber-100">Released to you when titiper confirms delivery.</p>
        </div>
      )}

      {error && (
        <p className="mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-600 border border-red-100">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={pending || !quote || !publicKey}
          className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? 'Signing on Stellar…' : '✅ Approve & Register Escrow'}
        </button>
        <button
          onClick={handleReject}
          disabled={pending}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
