import { Navbar } from '../components/Navbar'

const STEPS = [
  {
    n: '1',
    title: 'Find a runner & chat',
    body: 'Browse runners abroad, check their location and rating, and message them directly on WhatsApp to agree on your item.',
  },
  {
    n: '2',
    title: 'Titip your request',
    body: 'Submit what you want. The runner sends one all-in quote — item cost, taxes, shipping, and their fee.',
  },
  {
    n: '3',
    title: 'Lock funds in escrow',
    body: 'Approve, and your payment is locked in a Soroban smart contract on Stellar — not in the runner’s pocket.',
  },
  {
    n: '4',
    title: 'Ship, confirm, release',
    body: 'The runner buys and ships. You confirm receipt and funds release to them. Item unavailable? Full refund, automatically.',
  },
]

const FEATURES = [
  { icon: '🔒', title: 'Funds locked on-chain', body: 'The runner never touches your money until you confirm delivery.' },
  { icon: '↩️', title: 'Refund if unavailable', body: 'If the item can’t be sourced, the contract returns your funds in full.' },
  { icon: '💬', title: 'Chat on WhatsApp', body: 'Negotiate directly with your runner — no middleman, no lock-in.' },
  { icon: '⚡', title: 'Powered by Stellar', body: 'Fast, low-fee settlement in USDC / XLM on Soroban.' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#0a0a0a] px-5 pb-24 pt-24 text-center">
        <p className="mb-4 inline-block rounded-full border border-neutral-700 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#FF5C00]">
          Stellar · Soroban Escrow
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
          Jastip with<br /><span className="text-[#FF5C00]">zero risk.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-neutral-400 sm:text-lg">
          Titipin lets you shop overseas through trusted runners — with your payment locked
          in a smart contract until your item actually arrives.
        </p>
        <div className="mt-9 flex flex-col items-center gap-3">
          <a
            href="#how"
            className="inline-block rounded-full bg-[#FF5C00] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#E05000]"
          >
            See how it works ↓
          </a>
          <p className="text-xs text-neutral-600">Connect your wallet ↗ (top right) to get started.</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-20">
        <h2 className="text-center text-3xl font-black tracking-tight text-neutral-900">How it works</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-neutral-500">
          Four steps from "I want that" to it landing at your door.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5C00] text-sm font-black text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-base font-black tracking-tight text-neutral-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Titipin */}
      <section className="bg-neutral-50 px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-black tracking-tight text-neutral-900">Why Titipin</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-3 text-base font-black tracking-tight text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two paths */}
      <section className="mx-auto max-w-4xl px-5 py-24">
        <h2 className="text-center text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl">
          Two ways to use Titipin
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-100 bg-white p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF5C00]">Titiper</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-neutral-900">You want something abroad</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              Find a runner in the right city, agree on WhatsApp, and lock your payment in escrow.
              You only release it once the item is in your hands.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-[#0a0a0a] p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF5C00]">Runner</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-white">You’re traveling or living abroad</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              A runner is someone who shops for others overseas. Set up a profile, flip yourself to
              Ready, and earn a fee on every order — with payment guaranteed by the contract.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
