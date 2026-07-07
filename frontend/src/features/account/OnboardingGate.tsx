import { useWallet } from '../../wallet/WalletContext'
import { useAccount } from '../../account/AccountContext'
import { createAccount } from '../../lib/storage'
import { UsernameModal } from './UsernameModal'

/**
 * Renders a mandatory "pick a username" modal the first time a wallet connects
 * without an account. Everyone gets a lightweight account before using the app.
 */
export function OnboardingGate() {
  const { publicKey, isConnected } = useWallet()
  const { account, loading, refetch } = useAccount()

  if (!isConnected || !publicKey || loading || account) return null

  return (
    <UsernameModal
      title="Welcome to Titipin 👋"
      subtitle="Pick a username to get started. You can become a runner later."
      initial=""
      submitLabel="Create Account"
      onSubmit={async (username) => {
        await createAccount(publicKey, username)
        await refetch()
      }}
    />
  )
}
