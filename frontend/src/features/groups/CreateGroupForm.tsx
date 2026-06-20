import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../../wallet/WalletContext'
import { saveGroup, generateId } from '../../lib/storage'
import type { TitipGroup } from '../../types/group'

export function CreateGroupForm() {
  const { publicKey } = useWallet()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', sourceLocation: '', description: '',
    openUntil: '', estimatedPurchaseDate: '', estimatedDeliveryDate: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const input = 'w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#FF5C00] focus:outline-none transition'
  const label = 'mb-1.5 block text-xs font-bold uppercase tracking-widest text-neutral-500'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!publicKey) return
    setPending(true)
    setError('')
    try {
      const group: TitipGroup = {
        groupId: generateId(), runnerAddress: publicKey, ...form,
        groupStatus: 'open', feePercentage: 10,
        createdAt: new Date().toISOString(),
      }
      await saveGroup(group)
      navigate(`/groups/${group.groupId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create group')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={label}>Group Title</label>
        <input className={input} placeholder="e.g. Bangkok Beauty Run" required
          value={form.title} onChange={set('title')} />
      </div>
      <div>
        <label className={label}>Source Location</label>
        <input className={input} placeholder="e.g. Tokyo, Japan" required
          value={form.sourceLocation} onChange={set('sourceLocation')} />
      </div>
      <div>
        <label className={label}>Description</label>
        <textarea className={input} rows={3}
          placeholder="What are you sourcing? Any item restrictions?"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {([
          ['Open Until', 'openUntil'],
          ['Purchase Date', 'estimatedPurchaseDate'],
          ['Delivery Date', 'estimatedDeliveryDate'],
        ] as const).map(([lbl, key]) => (
          <div key={key}>
            <label className={label}>{lbl}</label>
            <input className={input} type="date" required
              value={form[key]} onChange={set(key)} />
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !publicKey}
        className="w-full rounded-xl bg-[#0a0a0a] py-3.5 text-sm font-black text-white transition hover:bg-[#FF5C00] disabled:opacity-50"
      >
        {pending ? 'Creating…' : 'Create Group'}
      </button>
    </form>
  )
}
