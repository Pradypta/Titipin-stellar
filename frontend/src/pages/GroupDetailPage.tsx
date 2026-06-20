import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useWallet } from '../wallet/WalletContext'
import { useRequestsByGroup } from '../hooks/useTitipRequests'
import { getGroupById } from '../lib/storage'
import { isGroupRunner } from '../lib/roles'
import { Navbar } from '../components/Navbar'
import { SubmitTitipRequestForm } from '../features/requests/SubmitTitipRequestForm'
import { RequestCard } from '../features/requests/RequestCard'
import { RoleGate } from '../components/RoleGate'
import type { TitipGroup } from '../types/group'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { publicKey, isConnected } = useWallet()
  const { requests, loading, refetch } = useRequestsByGroup(groupId)
  const [group, setGroup] = useState<TitipGroup | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (groupId) getGroupById(groupId).then(setGroup)
  }, [groupId])

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-neutral-400">Group not found.</p>
      </div>
    )
  }

  const runner = isGroupRunner(group, publicKey)
  const visibleRequests = runner
    ? requests
    : requests.filter((r) => r.titiperAddress === publicKey)

  const LOCKED = ['funded', 'purchased', 'shipped']
  const lockedRequests = requests.filter((r) => LOCKED.includes(r.requestStatus) && r.runnerQuote)
  const totalLocked = lockedRequests.reduce((s, r) => s + (r.runnerQuote ?? 0), 0)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-5 py-10">

        {/* Group header */}
        <div className="mb-8 rounded-2xl border border-neutral-100 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-semibold text-[#FF5C00]">{group.sourceLocation}</p>
              <h1 className="text-3xl font-black tracking-tight text-neutral-900">{group.title}</h1>
              {group.description && (
                <p className="mt-2 text-neutral-500">{group.description}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
              {group.groupStatus}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              ['Open Until', group.openUntil],
              ['Purchase', group.estimatedPurchaseDate],
              ['Delivery', group.estimatedDeliveryDate],
            ].map(([label, date]) => (
              <div key={label} className="rounded-xl bg-neutral-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label}</p>
                <p className="mt-0.5 text-sm font-bold text-neutral-800">
                  {new Date(date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Locked funds banner */}
          {totalLocked > 0 && (
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#0a0a0a] px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Locked in Smart Contract
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-white">
                  {totalLocked.toFixed(2)}
                  <span className="ml-2 text-lg text-[#FF5C00]">XLM</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-600">from</p>
                <p className="text-xl font-black text-white">
                  {lockedRequests.length} request{lockedRequests.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Runner badge */}
        {runner && (
          <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-3 text-sm font-semibold text-neutral-700">
            You are the runner of this group — review incoming requests below.
          </div>
        )}

        {/* Submit request */}
        <RoleGate condition={!runner && isConnected && group.groupStatus === 'open'}>
          <div className="mb-8">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full rounded-2xl border-2 border-dashed border-neutral-200 py-6 text-sm font-bold text-neutral-500 transition hover:border-[#FF5C00] hover:text-[#FF5C00]"
              >
                + Submit a Request in this Group
              </button>
            ) : (
              <div className="card p-7">
                <h2 className="mb-5 text-xl font-black tracking-tight text-neutral-900">Your Request</h2>
                <SubmitTitipRequestForm
                  groupId={group.groupId}
                  runnerAddress={group.runnerAddress}
                  onSubmitted={() => { setShowForm(false); refetch() }}
                />
                <button onClick={() => setShowForm(false)} className="mt-3 text-xs text-neutral-400 underline">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </RoleGate>

        <RoleGate condition={!runner && !isConnected}>
          <div className="mb-8 rounded-2xl border border-neutral-200 py-6 text-center text-sm font-semibold text-neutral-500">
            Connect your wallet to submit a request.
          </div>
        </RoleGate>

        {/* Request list */}
        <div>
          <h2 className="mb-5 text-xl font-black tracking-tight text-neutral-900">
            {runner ? `All Requests (${requests.length})` : 'Your Requests'}
          </h2>

          {loading && <p className="text-sm text-neutral-400">Loading…</p>}

          {!loading && visibleRequests.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-neutral-100 py-16 text-center">
              <p className="text-sm text-neutral-400">
                {runner ? 'No requests yet.' : "You haven't submitted any requests."}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {visibleRequests.map((r) => (
              <RequestCard key={r.requestId} request={r} group={group} publicKey={publicKey} onActionComplete={refetch} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
