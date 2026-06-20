import { Link } from 'react-router-dom'
import { useTitipGroups } from '../hooks/useTitipGroups'
import { GroupCard } from '../features/groups/GroupCard'
import { Navbar } from '../components/Navbar'
import { useWallet } from '../wallet/WalletContext'

export function GroupListPage() {
  const { groups, loading } = useTitipGroups()
  const { isConnected } = useWallet()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#0a0a0a] px-5 pb-16 pt-20 text-center">
        <p className="mb-4 inline-block rounded-full border border-neutral-700 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#FF5C00]">
          Stellar · Soroban Escrow
        </p>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
          Titip with<br />
          <span className="text-[#FF5C00]">zero risk.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-neutral-500">
          Funds locked on-chain. Released only when your item arrives. Full refund if unavailable.
        </p>
        {isConnected && (
          <Link
            to="/runner/groups/new"
            className="mt-8 inline-block rounded-full bg-[#FF5C00] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#E05000]"
          >
            Open a Jastip Group →
          </Link>
        )}
      </section>

      {/* Groups */}
      <main className="mx-auto max-w-5xl px-5 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900">Open Groups</h2>
            {!loading && (
              <p className="mt-1 text-sm text-neutral-400">{groups.length} active jastip session{groups.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          {isConnected && (
            <Link
              to="/runner/groups/new"
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              + New Group
            </Link>
          )}
        </div>

        {loading && (
          <div className="py-20 text-center text-sm text-neutral-400">Loading…</div>
        )}

        {!loading && groups.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-24 text-center">
            <p className="text-3xl font-black text-neutral-200">No open groups</p>
            {isConnected && (
              <Link to="/runner/groups/new" className="mt-4 inline-block text-sm font-semibold text-[#FF5C00] underline underline-offset-4">
                Be the first runner
              </Link>
            )}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => <GroupCard key={g.groupId} group={g} />)}
        </div>
      </main>
    </div>
  )
}
