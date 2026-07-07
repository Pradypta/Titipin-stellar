import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useWallet } from '../wallet/WalletContext'
import { useRequestsByGroup } from '../hooks/useTitipRequests'
import { getGroupById } from '../lib/storage'
import { isGroupRunner } from '../lib/roles'
import { whatsappUrl } from '../lib/whatsapp'
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
  const waUrl = whatsappUrl(
    group.whatsappNumber,
    `Hi ${group.username}! I found you on Titipin and I'd like to titip an item.`,
  )
  const ready = group.groupStatus === 'ready'
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
              <p className="mb-1 text-sm font-semibold text-[#FF5C00]">📍 {group.location}</p>
              <h1 className="text-3xl font-black tracking-tight text-neutral-900">{group.username}</h1>
              {group.background && (
                <p className="mt-2 text-neutral-500">{group.background}</p>
              )}
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              ready ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'
            }`}>
              {ready ? '🟢 Ready' : 'Not Ready'}
            </span>
          </div>

          {/* Chat with runner on WhatsApp */}
          {!runner && waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.006c6.585 0 11.946-5.335 11.949-11.896 0-3.176-1.24-6.165-3.487-8.411"/>
              </svg>
              Chat with runner on WhatsApp
            </a>
          )}

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
        <RoleGate condition={!runner && isConnected && group.groupStatus === 'ready'}>
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
