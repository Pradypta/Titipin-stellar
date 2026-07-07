import { useState } from 'react'

interface Props {
  title: string
  subtitle?: string
  initial: string
  submitLabel: string
  onSubmit: (username: string) => Promise<void>
  onClose?: () => void   // omit to make the modal mandatory (onboarding)
}

export function UsernameModal({ title, subtitle, initial, submitLabel, onSubmit, onClose }: Props) {
  const [username, setUsername] = useState(initial)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = username.trim()
    if (!name) return
    setPending(true)
    setError('')
    try {
      await onSubmit(name)
      onClose?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save username')
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-black tracking-tight text-neutral-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. rina_tokyo"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#FF5C00] focus:outline-none"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={pending || username.trim() === ''}
            className="w-full rounded-xl bg-[#0a0a0a] py-3 text-sm font-black text-white transition hover:bg-[#FF5C00] disabled:opacity-50"
          >
            {pending ? 'Saving…' : submitLabel}
          </button>

          {onClose && (
            <button type="button" onClick={onClose} className="w-full text-xs text-neutral-400 underline">
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
