import { useState } from 'react'
import { useWallet } from '../wallet/WalletContext'

export function WalletConnectButton() {
  const { isConnected, publicKey, connect, disconnect } = useWallet()
  const [pending, setPending] = useState(false)

  async function handleConnect() {
    setPending(true)
    try { await connect() }
    catch { /* Freighter will show its own error */ }
    finally { setPending(false) }
  }

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 font-mono text-xs text-neutral-400 sm:inline">
          {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-500 transition hover:border-neutral-500 hover:text-white"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={pending}
      className="rounded-full bg-[#FF5C00] px-4 py-1.5 text-sm font-bold text-white transition hover:bg-[#E05000] disabled:opacity-50"
    >
      {pending ? 'Connecting…' : 'Connect Wallet'}
    </button>
  )
}
