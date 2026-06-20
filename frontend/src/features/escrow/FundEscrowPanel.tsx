import { useState } from 'react'
import { useWallet } from '../../wallet/WalletContext'
import { fundEscrow } from '../../contract/escrowService'
import { updateRequestStatus } from '../../lib/storage'
import type { TitipRequest } from '../../types/request'

interface Props {
  request: TitipRequest
  onFunded: () => void
}

export function FundEscrowPanel({ request, onFunded }: Props) {
  const { publicKey } = useWallet()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  if (request.runnerQuote === null) return null
  const quote = request.runnerQuote

  async function handleFund() {
    if (!publicKey) return
    setPending(true)
    setError('')
    try {
      await fundEscrow(publicKey, request.requestId)
      await updateRequestStatus(request.requestId, 'funded')
      onFunded()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
      <div className="mb-4 flex items-center justify-between rounded-xl bg-[#0a0a0a] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Lock in escrow</p>
        <p className="text-2xl font-black text-white">
          {quote.toFixed(2)} <span className="text-[#FF5C00]">XLM</span>
        </p>
      </div>

      <p className="mb-4 text-xs text-neutral-500">
        Freighter will open for your signature. XLM moves into the Titipin smart contract. Released to runner only on your confirmation. Full refund if item becomes unavailable.
      </p>

      {error && (
        <p className="mb-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-600">{error}</p>
      )}

      <button
        onClick={handleFund}
        disabled={pending || !publicKey}
        className="w-full rounded-xl bg-[#FF5C00] py-3 text-sm font-black text-white transition hover:bg-[#E05000] disabled:opacity-50"
      >
        {pending ? 'Waiting for Freighter…' : `Lock ${quote.toFixed(2)} XLM`}
      </button>
    </div>
  )
}
