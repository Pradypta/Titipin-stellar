import { useState } from 'react'
import { useWallet } from '../../wallet/WalletContext'
import { saveRequest, generateId } from '../../lib/storage'
import type { TitipRequest } from '../../types/request'

interface Props {
  groupId: string
  runnerAddress: string
  onSubmitted: () => void
}

export function SubmitTitipRequestForm({ groupId, runnerAddress, onSubmitted }: Props) {
  const { publicKey } = useWallet()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    itemName: '', itemLink: '', variant: '',
    quantity: '1', notes: '',
  })

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!publicKey) return

    setPending(true)
    setError('')
    try {
      const request: TitipRequest = {
        requestId:      generateId(),
        groupId,
        runnerAddress,
        titiperAddress: publicKey,
        itemName:       form.itemName,
        itemLink:       form.itemLink,
        variant:        form.variant,
        quantity:       parseInt(form.quantity, 10),
        notes:          form.notes,
        estimatedPrice: null,   // runner sets the price when they quote
        runnerQuote:    null,
        requestStatus:  'submitted',
        createdAt:      new Date().toISOString(),
        statusUpdatedAt: null,
        trackingNumber:  null,
      }
      await saveRequest(request)
      setSubmitted(true)
      onSubmitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit request')
    } finally {
      setPending(false)
    }
  }

  const input = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none'
  const label = 'mb-1 block text-sm font-medium text-gray-700'

  if (submitted) {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
        ✅ Request submitted! The runner will review and send you a quote. You'll pay only after you agree.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={label}>Item Name *</label>
        <input className={input} placeholder="e.g. Skintific Moisturizer 50ml" required {...f('itemName')} />
      </div>
      <div>
        <label className={label}>Item Link</label>
        <input className={input} placeholder="URL to the item (optional)" type="url" {...f('itemLink')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Variant / Size / Color</label>
          <input className={input} placeholder="e.g. 50ml, Blue" {...f('variant')} />
        </div>
        <div>
          <label className={label}>Quantity *</label>
          <input className={input} type="number" min="1" required {...f('quantity')} />
        </div>
      </div>
      <div>
        <label className={label}>Notes for Runner</label>
        <textarea className={input} rows={2}
          placeholder="Special instructions, color preference, etc." {...f('notes')} />
      </div>
      <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
        ℹ️ No payment yet. The runner will send you an all-in quote covering item cost, taxes, duties, and shipping. You lock funds in escrow only after you see and agree to the quote.
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending || !publicKey}
        className="rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? 'Submitting…' : 'Submit Request'}
      </button>
    </form>
  )
}
