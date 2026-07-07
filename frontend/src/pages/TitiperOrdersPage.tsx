import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../wallet/WalletContext'
import { useRequestsByTitiper } from '../hooks/useTitipRequests'
import { getGroupById } from '../lib/storage'
import { Navbar } from '../components/Navbar'
import { WalletConnectButton } from '../components/WalletConnectButton'
import { StatusBadge } from '../components/StatusBadge'
import { RequestStatusTimeline } from '../components/RequestStatusTimeline'
import { FundEscrowPanel } from '../features/escrow/FundEscrowPanel'
import { ConfirmReceiptPanel } from '../features/escrow/ConfirmReceiptPanel'
import type { TitipGroup } from '../types/group'

export function TitiperOrdersPage() {
  const { publicKey, isConnected } = useWallet()
  const { requests, loading, refetch } = useRequestsByTitiper(publicKey)
  const [groups, setGroups] = useState<Record<string, TitipGroup>>({})

  useEffect(() => {
    const ids = [...new Set(requests.map((r) => r.groupId))]
    Promise.all(ids.map((id) => getGroupById(id))).then((results) => {
      const map: Record<string, TitipGroup> = {}
      results.forEach((g) => { if (g) map[g.groupId] = g })
      setGroups(map)
    })
  }, [requests])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center gap-5 py-32">
          <p className="text-neutral-500">Connect your wallet to view your orders.</p>
          <WalletConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <div className="mb-10">
          <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[#FF5C00]">Titiper</p>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900">My Orders</h1>
        </div>

        {loading && <p className="text-neutral-400">Loading…</p>}

        {!loading && requests.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-24 text-center">
            <p className="text-2xl font-black text-neutral-200">No orders yet</p>
            <Link to="/" className="mt-4 inline-block text-sm font-semibold text-[#FF5C00] underline underline-offset-4">
              Browse open groups
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {requests.map((req) => {
            const group = groups[req.groupId]
            const locked = ['funded', 'purchased', 'shipped'].includes(req.requestStatus)

            return (
              <div key={req.requestId} className={`card p-6 ${locked ? 'card-locked' : ''}`}>
                {/* Header */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-neutral-900">{req.itemName}</p>
                    {req.variant && <p className="text-xs text-neutral-400">{req.variant} · qty {req.quantity}</p>}
                    {group && (
                      <Link to={`/groups/${group.groupId}`} className="text-xs font-semibold text-[#FF5C00] hover:underline">
                        {group.username} →
                      </Link>
                    )}
                  </div>
                  <StatusBadge status={req.requestStatus} />
                </div>

                {/* Step tracker */}
                <div className="mb-4">
                  <RequestStatusTimeline status={req.requestStatus} />
                </div>

                {/* Locked indicator */}
                {locked && req.runnerQuote && (
                  <div className="mb-4 flex items-center justify-between rounded-xl bg-[#0a0a0a] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Locked in escrow</p>
                    <p className="text-lg font-black text-[#FF5C00]">{req.runnerQuote.toFixed(2)} XLM</p>
                  </div>
                )}

                {/* Quote (before funding) */}
                {req.runnerQuote !== null && req.requestStatus === 'approved_waiting_payment' && (
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                    <p className="text-sm text-neutral-600">Runner's all-in quote</p>
                    <p className="text-lg font-black text-neutral-900">{req.runnerQuote.toFixed(2)} XLM</p>
                  </div>
                )}

                {/* Actions */}
                {req.requestStatus === 'submitted' && (
                  <p className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500">
                    Waiting for runner to approve and send a quote.
                  </p>
                )}
                {req.requestStatus === 'approved_waiting_payment' && (
                  <FundEscrowPanel request={req} onFunded={refetch} />
                )}
                {req.requestStatus === 'shipped' && (
                  <ConfirmReceiptPanel requestId={req.requestId} onConfirmed={refetch} />
                )}
                {req.requestStatus === 'unavailable' && (
                  <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500">
                    Request declined by runner. No payment was made.
                  </p>
                )}
                {req.requestStatus === 'refunded' && (
                  <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-600">
                    Item unavailable — funds refunded to your wallet.
                  </p>
                )}
                {req.requestStatus === 'completed' && (
                  <p className="rounded-xl border border-green-100 bg-green-50 p-3 text-xs font-semibold text-green-700">
                    Delivered. Thank you for using Titipin.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
