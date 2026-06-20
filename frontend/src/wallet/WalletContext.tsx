import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isConnected, isAllowed, requestAccess } from '@stellar/freighter-api'
import type { WalletState } from '../types/wallet'

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const [state, setState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    network: null,
  })

  // Bug 1 fix: silently restore a previous session only if the site was
  // already authorized. Never call requestAccess() on mount — that opens
  // the Freighter popup before the user has clicked anything.
  useEffect(() => {
    async function restore() {
      const connected = await isConnected()
      if (!connected.isConnected) return

      const allowed = await isAllowed()
      if (!allowed.isAllowed) return  // First visit — wait for user to click Connect

      // Site is already allowed: requestAccess() returns silently (no popup)
      const access = await requestAccess()
      if (!access.error && access.address) {
        setState({ isConnected: true, publicKey: access.address, network: 'testnet' })
      }
    }
    restore()
  }, [])

  async function connect() {
    const check = await isConnected()
    if (!check.isConnected) {
      throw new Error('Freighter is not installed. Get it at https://www.freighter.app')
    }
    const access = await requestAccess()
    if (access.error) throw new Error(access.error.message)
    setState({ isConnected: true, publicKey: access.address, network: 'testnet' })
  }

  // Bug 2 fix: after disconnecting, always go back to the group list so the
  // user sees all public groups regardless of which wallet they connect next.
  function disconnect() {
    setState({ isConnected: false, publicKey: null, network: null })
    navigate('/')
  }

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>')
  return ctx
}
