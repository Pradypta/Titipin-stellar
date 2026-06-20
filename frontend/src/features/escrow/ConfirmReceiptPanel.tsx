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

  async function handleConfirm() {
    if (!publicKey) return
    setPending(true)
    setError('')
    try {
      await confirmReceiptOnChain(publicKey, requestId)
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
