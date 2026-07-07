import { Link } from 'react-router-dom'
import { useWallet } from '../wallet/WalletContext'
import { useRunnerGroups } from '../hooks/useTitipGroups'
import { useRunnerRequests } from '../hooks/useTitipRequests'
import { Navbar } from '../components/Navbar'
import { WalletConnectButton } from '../components/WalletConnectButton'
import { RequestCard } from '../features/requests/RequestCard'
import type { TitipGroup } from '../types/group'
import type { TitipRequest } from '../types/request'

const ACTIVE_STATUSES = ['submitted', 'approved_waiting_payment', 'funded', 'purchased', 'shipped']
const LOCKED_STATUSES = ['funded', 'purchased', 'shipped']

// ── Sub-components receive data as props — NO hooks inside ────────────────────

function GroupSummaryCard({
  group,
  requests,
}: {
  group: TitipGroup
  requests: TitipRequest[]
}) {
  const activeCount = requests.filter((r) => ACTIVE_STATUSES.includes(r.requestStatus)).length
  const locked = requests
    .filter((r) => LOCKED_STATUSES.includes(r.requestStatus))
    .reduce((s, r) => s + (r.runnerQuote ?? 0), 0)

  return (
    <Link to={`/groups/${group.groupId}`} className="card block p-5 hover:no-underline">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-black text-neutral-900">{group.username}</p>
          <p className="text-xs text-[#FF5C00]">📍 {group.location}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          group.groupStatus === 'ready' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'
        }`}>
          {group.groupStatus === 'ready' ? 'Ready' : 'Not Ready'}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Active</p>
          <p className="text-xl font-black text-neutral-900">{activeCount}</p>
        </div>
        {locked > 0 && (
          <div className="rounded-xl bg-[#0a0a0a] px-3 py-1.5 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Locked</p>
            <p className="text-sm font-black text-[#FF5C00]">{locked.toFixed(2)} XLM</p>
          </div>
        )}
      </div>
    </Link>
  )
}

function GroupRequestsRow({
  group,
  requests,
  publicKey,
  onActionComplete,
}: {
  group: TitipGroup
  requests: TitipRequest[]
  publicKey: string
  onActionComplete: () => void
}) {
  const active = requests.filter((r) => ACTIVE_STATUSES.includes(r.requestStatus))
  if (active.length === 0) return null

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-100" />
        <Link
          to={`/groups/${group.groupId}`}
          className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-[#FF5C00]"
        >
          {group.username} · {group.location}
        </Link>
        <div className="h-px flex-1 bg-neutral-100" />
      </div>

      <div className="space-y-3">
        {active.map((r) => (
          <RequestCard
            key={r.requestId}
            request={r}
            group={group}
            publicKey={publicKey}
            onActionComplete={onActionComplete}
          />
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function RunnerDashboardPage() {
  const { publicKey, isConnected } = useWallet()
  const { groups, loading: groupsLoading } = useRunnerGroups(publicKey)
  // One single query + one Realtime subscription for all runner requests
  const { requests: allRequests, refetch } = useRunnerRequests(publicKey)

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center gap-5 py-32">
          <p className="text-neutral-500">Connect your wallet to view your runner dashboard.</p>
          <WalletConnectButton />
        </div>
      </div>
    )
  }

  // Group requests by groupId for easy lookup
  const requestsByGroup = allRequests.reduce<Record<string, TitipRequest[]>>((acc, r) => {
    if (!acc[r.groupId]) acc[r.groupId] = []
    acc[r.groupId].push(r)
    return acc
  }, {})

  const hasAnyActiveRequests = allRequests.some((r) => ACTIVE_STATUSES.includes(r.requestStatus))

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-14">

        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[#FF5C00]">Runner</p>
            <h1 className="text-4xl font-black tracking-tight text-neutral-900">Dashboard</h1>
          </div>
          <Link
            to="/runner/groups/new"
            className="rounded-full bg-[#FF5C00] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#E05000]"
          >
            {groups.length > 0 ? 'Edit Profile' : '+ Create Profile'}
          </Link>
        </div>

        {groupsLoading && <p className="text-neutral-400">Loading…</p>}

        {!groupsLoading && groups.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-24 text-center">
            <p className="text-2xl font-black text-neutral-200">No profile yet</p>
            <Link to="/runner/groups/new" className="mt-4 inline-block text-sm font-semibold text-[#FF5C00] underline underline-offset-4">
              Create your runner profile
            </Link>
          </div>
        )}

        {!groupsLoading && groups.length > 0 && (
          <>
            {/* ── Section 1: Your Groups ── */}
            <section className="mb-12">
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Your Profile
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((g) => (
                  <GroupSummaryCard
                    key={g.groupId}
                    group={g}
                    requests={requestsByGroup[g.groupId] ?? []}
                  />
                ))}
              </div>
            </section>

            {/* ── Section 2: Active Requests ── */}
            <section>
              <h2 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Active Requests
              </h2>

              {groups.map((g) => (
                <GroupRequestsRow
                  key={g.groupId}
                  group={g}
                  requests={requestsByGroup[g.groupId] ?? []}
                  publicKey={publicKey!}
                  onActionComplete={refetch}
                />
              ))}

              {!hasAnyActiveRequests && (
                <div className="rounded-2xl border-2 border-dashed border-neutral-100 py-16 text-center">
                  <p className="text-sm text-neutral-400">No active requests across your groups.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
