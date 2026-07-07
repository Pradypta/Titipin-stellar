import { Link } from 'react-router-dom'
import { useTitipGroups } from '../hooks/useTitipGroups'
import { GroupCard } from '../features/groups/GroupCard'
import { Navbar } from '../components/Navbar'
import { useWallet } from '../wallet/WalletContext'
import { useAccount } from '../account/AccountContext'
import { LandingPage } from './LandingPage'

export function GroupListPage() {
  const { groups, loading } = useTitipGroups()
  const { isConnected, publicKey } = useWallet()
  const { account } = useAccount()
  const canBecomeRunner = !!account && !account.isRunner

  // Not connected → marketing landing page instead of the runner list
  if (!isConnected) return <LandingPage />

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
        {canBecomeRunner && (
          <Link
            to="/runner/groups/new"
            className="mt-8 inline-block rounded-full bg-[#FF5C00] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#E05000]"
          >
            Become a Runner →
          </Link>
        )}
      </section>

      {/* Groups */}
      <main className="mx-auto max-w-5xl px-5 py-14">
        {/* What's a runner? */}
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4">
          <span className="text-xl">🧳</span>
          <p className="text-sm leading-relaxed text-neutral-600">
            <span className="font-bold text-neutral-900">Runners</span> are people traveling or living
            abroad who shop for you and ship it home. Pick one in the right city, agree on WhatsApp,
            and your payment stays locked in escrow until your item arrives.
          </p>
        </div>

        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900">Ready Runners</h2>
            {!loading && (
              <p className="mt-1 text-sm text-neutral-400">{groups.length} runner{groups.length !== 1 ? 's' : ''} ready for titip</p>
            )}
          </div>
          {account?.isRunner && (
            <Link
              to="/runner/groups/new"
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              My Profile
            </Link>
          )}
        </div>

        {loading && (
          <div className="py-20 text-center text-sm text-neutral-400">Loading…</div>
        )}

        {!loading && groups.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-24 text-center">
            <p className="text-3xl font-black text-neutral-200">No runners ready</p>
            {canBecomeRunner && (
              <Link to="/runner/groups/new" className="mt-4 inline-block text-sm font-semibold text-[#FF5C00] underline underline-offset-4">
                Be the first runner
              </Link>
            )}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => <GroupCard key={g.groupId} group={g} publicKey={publicKey} />)}
        </div>
      </main>
    </div>
  )
}
