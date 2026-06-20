import {
  PenLine,
  MessageSquare,
  Lock,
  ShoppingCart,
  Package,
  PartyPopper,
  XCircle,
  RotateCcw,
} from 'lucide-react'
import type { TitipRequestStatus } from '../types/request'

const STEPS: {
  key: TitipRequestStatus
  label: string
  Icon: React.FC<{ size?: number; className?: string }>
}[] = [
  { key: 'submitted',                label: 'Submitted',  Icon: PenLine       },
  { key: 'approved_waiting_payment', label: 'Approved',   Icon: MessageSquare },
  { key: 'funded',                   label: 'Funded',     Icon: Lock          },
  { key: 'purchased',                label: 'Purchased',  Icon: ShoppingCart  },
  { key: 'shipped',                  label: 'Shipped',    Icon: Package       },
  { key: 'completed',                label: 'Delivered',  Icon: PartyPopper   },
]

const STEP_KEYS = STEPS.map((s) => s.key)

export function RequestStatusTimeline({ status }: { status: TitipRequestStatus }) {
  // Unavailable = runner rejected the request before any payment — no money involved
  if (status === 'unavailable') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5">
        <XCircle size={14} className="shrink-0 text-neutral-400" />
        <span className="text-xs font-semibold text-neutral-500">
          Request declined by runner
        </span>
      </div>
    )
  }

  // Refunded = item became unavailable after titiper had already funded escrow
  if (status === 'refunded') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5">
        <RotateCcw size={14} className="shrink-0 text-red-400" />
        <span className="text-xs font-semibold text-red-600">
          Item unavailable — funds refunded to titiper
        </span>
      </div>
    )
  }

  const currentIdx = STEP_KEYS.indexOf(status)

  return (
    // overflow-x-auto clips vertical space — py-2 gives room for the glow ring
    <div className="overflow-x-auto py-2">
      <div className="flex min-w-max items-start">
        {STEPS.map((step, i) => {
          const done    = i < currentIdx
          const active  = i === currentIdx
          const pending = i > currentIdx

          return (
            <div key={step.key} className="flex items-center">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all
                    ${done    ? 'bg-[#0a0a0a]'                                         : ''}
                    ${active  ? 'bg-[#FF5C00] shadow-[0_0_0_4px_rgba(255,92,0,0.18)]' : ''}
                    ${pending ? 'border-2 border-neutral-200 bg-white'                 : ''}
                  `}
                >
                  <step.Icon
                    size={15}
                    className={`
                      ${done || active ? 'text-white'       : ''}
                      ${pending        ? 'text-neutral-300' : ''}
                    `}
                  />
                </div>

                <span
                  className={`whitespace-nowrap text-[10px] font-semibold
                    ${done    ? 'text-neutral-400' : ''}
                    ${active  ? 'text-[#FF5C00]'   : ''}
                    ${pending ? 'text-neutral-300'  : ''}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div
                  className="mb-5 h-px w-8 sm:w-12"
                  style={{ backgroundColor: i < currentIdx ? '#0a0a0a' : '#e5e5e5' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
