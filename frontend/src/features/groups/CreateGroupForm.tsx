import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../../wallet/WalletContext'
import { useAccount } from '../../account/AccountContext'
import { saveGroup } from '../../lib/storage'
import type { TitipGroup, TitipGroupStatus } from '../../types/group'

export function CreateGroupForm() {
  const { publicKey } = useWallet()
  const { account, refetch } = useAccount()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [form, setForm] = useState({
    username: '', location: '', background: '', whatsappNumber: '',
    status: 'ready' as TitipGroupStatus,
  })

  // Prefill from the wallet's account — username carries over from onboarding,
  // and runner fields are filled in when editing an existing profile.
  useEffect(() => {
    if (!account) return
    setCreatedAt(account.createdAt)
    setForm({
      username:       account.username,
      location:       account.location,
      background:     account.background,
      whatsappNumber: account.whatsappNumber,
      // existing runners keep their status; a titiper becoming a runner defaults to Ready
      status:         account.isRunner ? account.groupStatus : 'ready',
    })
  }, [account])

  const set = (k: 'username' | 'location' | 'background' | 'whatsappNumber') =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
        groupId:        publicKey,          // deterministic → one profile per runner
        runnerAddress:  publicKey,
        username:       form.username,
        location:       form.location,
        background:     form.background,
        whatsappNumber: form.whatsappNumber,
        isRunner:       true,               // saving the runner profile upgrades the account
        groupStatus:    form.status,
        feePercentage:  10,
        createdAt:      createdAt ?? new Date().toISOString(),
      }
      await saveGroup(group)
      await refetch()                       // update navbar (Become a Runner → Profile)
      navigate(`/groups/${group.groupId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={label}>Username</label>
        <input className={input} placeholder="e.g. rina_tokyo" required
          value={form.username} onChange={set('username')} />
      </div>
      <div>
        <label className={label}>Location</label>
        <input className={input} placeholder="Lokasi sekarang — e.g. Tokyo, Japan" required
          value={form.location} onChange={set('location')} />
      </div>
      <div>
        <label className={label}>WhatsApp Number</label>
        <input className={input} placeholder="e.g. 6281234567890 (country code, no +)" required
          inputMode="tel" value={form.whatsappNumber} onChange={set('whatsappNumber')} />
        <p className="mt-1.5 text-xs text-neutral-400">
          Titipers tap this to chat with you on WhatsApp. Use international format.
        </p>
      </div>
      <div>
        <label className={label}>Background</label>
        <textarea className={input} rows={3}
          placeholder="Tell titipers about yourself — what you can source, how often you travel, etc."
          value={form.background} onChange={set('background')} />
      </div>

      <div>
        <label className={label}>Status</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['ready', 'Ready', 'Open for titip — shown to titipers'],
            ['not_ready', 'Not Ready', 'Hidden from the public list'],
          ] as const).map(([value, title, hint]) => {
            const active = form.status === value
            return (
              <button
                type="button"
                key={value}
                onClick={() => setForm((f) => ({ ...f, status: value }))}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? 'border-[#FF5C00] bg-[#FFF3EC]'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <p className={`text-sm font-bold ${active ? 'text-[#FF5C00]' : 'text-neutral-800'}`}>
                  {value === 'ready' ? '🟢 ' : '⚪️ '}{title}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !publicKey}
        className="w-full rounded-xl bg-[#0a0a0a] py-3.5 text-sm font-black text-white transition hover:bg-[#FF5C00] disabled:opacity-50"
      >
        {pending ? 'Saving…' : account?.isRunner ? 'Save Profile' : 'Become a Runner'}
      </button>
    </form>
  )
}
