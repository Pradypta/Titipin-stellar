import { useWallet } from '../wallet/WalletContext'
import { CreateGroupForm } from '../features/groups/CreateGroupForm'
import { Navbar } from '../components/Navbar'
import { WalletConnectButton } from '../components/WalletConnectButton'

export function CreateGroupPage() {
  const { isConnected } = useWallet()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-14">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#FF5C00]">Runner</p>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900">Create Jastip Group</h1>
          <p className="mt-2 text-neutral-500">
            Open a sourcing session. Titipers submit requests — you quote, they lock funds, escrow handles the rest.
          </p>
        </div>

        {isConnected ? (
          <div className="card p-8">
            <CreateGroupForm />
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-20 text-center">
            <p className="mb-5 text-neutral-500">Connect your wallet to create a group.</p>
            <WalletConnectButton />
          </div>
        )}
      </main>
    </div>
  )
}
