import { useState } from 'react'
import { useWallet } from '../../wallet/WalletContext'
import { confirmReceiptOnChain } from '../../contract/escrowService'
import { updateRequestStatus } from '../../lib/storage'

interface Props {
  requestId: string
  onConfirmed: () => void
}

export function ConfirmReceiptPanel({ requestId, onConfirmed }: Props) {
  const { publicKey } = useWallet()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  // Pre-selected 5★: the lazy path gives a fair "no complaint" rating, while an
  // unhappy titiper actively drags it down. 0 = skipped (they can clear it).
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)

  async function handleConfirm() {
    if (!publicKey) return
    setPending(true)
    setError('')
    try {
      await confirmReceiptOnChain(publicKey, requestId, rating)
      await updateRequestStatus(requestId, 'completed')
      onConfirmed()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Confirmation failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
      <p className="mb-2 font-bold text-green-900">Confirm Delivery</p>
      <p className="mb-4 text-xs text-green-700">
        Confirming releases the escrowed funds to the runner. Only confirm if you have received your item.
      </p>

      <div className="mb-4">
        <p className="mb-1 text-xs font-semibold text-green-900">Rate your runner</p>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Runner rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              onClick={() => setRating(rating === star ? 0 : star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              disabled={pending}
              className="text-2xl leading-none transition disabled:opacity-50"
            >
              <span className={(hover || rating) >= star ? 'text-amber-400' : 'text-green-200'}>★</span>
            </button>
          ))}
          <span className="ml-2 text-xs text-green-700">
            {rating > 0 ? `${rating}/5` : 'No rating'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-green-600">
          Tap the selected star again to skip rating. Rating won’t delay your payout.
        </p>
      </div>

      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
      <button
        onClick={handleConfirm}
        disabled={pending}
        className="w-full rounded-xl bg-green-700 py-3 text-sm font-black text-white transition hover:bg-green-800 disabled:opacity-50"
      >
        {pending ? 'Processing…' : 'I received my item'}
      </button>
    </div>
  )
}
