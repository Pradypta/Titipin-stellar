import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useWallet } from '../wallet/WalletContext'
import { getAccount } from '../lib/storage'
import type { TitipGroup } from '../types/group'

interface AccountState {
  account: TitipGroup | null  // the wallet's account row (null if not created yet)
  loading: boolean
  refetch: () => Promise<void>
}

const AccountCtx = createContext<AccountState>({
  account: null,
  loading: true,
  refetch: async () => {},
})

export function useAccount() {
  return useContext(AccountCtx)
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { publicKey, isConnected } = useWallet()
  const [account, setAccount] = useState<TitipGroup | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!isConnected || !publicKey) {
      setAccount(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setAccount(await getAccount(publicKey))
    } finally {
      setLoading(false)
    }
  }, [publicKey, isConnected])

  useEffect(() => { refetch() }, [refetch])

  return (
    <AccountCtx.Provider value={{ account, loading, refetch }}>
      {children}
    </AccountCtx.Provider>
  )
}
