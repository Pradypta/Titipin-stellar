import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../wallet/WalletContext'
import { useAccount } from '../account/AccountContext'
import { updateUsername } from '../lib/storage'
import { WalletConnectButton } from './WalletConnectButton'
import { UsernameModal } from '../features/account/UsernameModal'

export function Navbar() {
  const { publicKey, isConnected } = useWallet()
  const { account, refetch } = useAccount()
  const { pathname } = useLocation()
  const [editing, setEditing] = useState(false)

  const navLink = (to: string, label: string) => {
    const active = pathname === to
    return (
      <Link
        key={label}
        to={to}
        className={`whitespace-nowrap px-3 py-1.5 text-sm font-semibold rounded-full transition-all
          ${active
            ? 'bg-[#FF5C00] text-white'
            : 'text-neutral-400 hover:text-white'
          }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-800 bg-[#0a0a0a]">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
        {/* Logo */}
        <Link to="/" className="mr-2 shrink-0">
          <span className="text-lg font-black tracking-tight text-white">
            Titipin<span className="text-[#FF5C00]">.</span>
          </span>
        </Link>

        {/* Links — hidden until connected; runner links only for runners */}
        <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-hide">
          {isConnected && navLink('/', 'Runners')}
          {isConnected && account && navLink('/my-orders', 'My Orders')}
          {account?.isRunner && navLink('/runner/dashboard', 'Dashboard')}
          {account?.isRunner && navLink('/runner/groups/new', 'Profile')}
        </div>

        {/* Username + wallet — shrink-0 so they never shift */}
        <div className="flex shrink-0 items-center gap-2">
          {account && (
            <button
              onClick={() => setEditing(true)}
              title="Edit username"
              className="hidden max-w-[8rem] truncate rounded-full border border-neutral-700 px-3 py-1.5 text-sm font-semibold text-neutral-300 transition hover:text-white sm:block"
            >
              @{account.username}
            </button>
          )}
          <WalletConnectButton />
        </div>
      </div>

      {editing && publicKey && (
        <UsernameModal
          title="Edit username"
          initial={account?.username ?? ''}
          submitLabel="Save"
          onSubmit={async (name) => {
            await updateUsername(publicKey, name)
            await refetch()
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </nav>
  )
}
