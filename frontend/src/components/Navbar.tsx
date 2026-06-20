import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../wallet/WalletContext'
import { WalletConnectButton } from './WalletConnectButton'

export function Navbar() {
  const { isConnected } = useWallet()
  const { pathname } = useLocation()

  const navLink = (to: string, label: string) => {
    const active = pathname === to
    return (
      <Link
        key={to}
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

        {/* Links — always visible, horizontal scroll on tiny screens */}
        <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-hide">
          {navLink('/', 'Groups')}
          {isConnected && navLink('/my-orders', 'My Orders')}
          {isConnected && navLink('/runner/dashboard', 'Dashboard')}
          {isConnected && navLink('/runner/groups/new', '+ New Group')}
        </div>

        {/* Wallet — shrink-0 so it never shifts */}
        <div className="shrink-0">
          <WalletConnectButton />
        </div>
      </div>
    </nav>
  )
}
