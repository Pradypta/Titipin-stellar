import { useState, useEffect } from 'react'
import { RequestStatusTimeline } from '../../components/RequestStatusTimeline'
import { autoCompleteIfExpired } from '../../lib/storage'
import { RunnerActionBar } from './RunnerActionBar'
import { FundEscrowPanel } from '../escrow/FundEscrowPanel'
import { ConfirmReceiptPanel } from '../escrow/ConfirmReceiptPanel'
import { ApproveRequestPanel } from './ApproveRequestPanel'
import { isGroupRunner, isRequestTitiper, runnerActions, titiperActions } from '../../lib/roles'
import type { TitipRequest } from '../../types/request'
import type { TitipGroup } from '../../types/group'

interface Props {
  request: TitipRequest
  group: TitipGroup
  publicKey: string | null
  onActionComplete: () => void
}

const LOCKED = ['funded', 'purchased', 'shipped']

export function RequestCard({ request, group, publicKey, onActionComplete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const runner = isGroupRunner(group, publicKey)
  const titiper = isRequestTitiper(request, publicKey)
  const can = runner ? runnerActions(request.requestStatus) : titiperActions(request.requestStatus)
  const locked = LOCKED.includes(request.requestStatus) && request.runnerQuote !== null

  // Auto-complete: if shipped > 3 days with no titiper confirmation, mark delivered
  useEffect(() => {
    if (request.requestStatus !== 'shipped') return
    autoCompleteIfExpired(request.requestId, request.statusUpdatedAt, 3).then((triggered) => {
      if (triggered) onActionComplete()
    })
  }, [request.requestId, request.requestStatus, request.statusUpdatedAt, onActionComplete])

  return (
    <div className={`card overflow-hidden ${locked ? 'card-locked' : ''}`}>
      {/* Header — click to expand details & actions */}
      <div
        className="flex cursor-pointer items-start gap-4 p-5 pb-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-bold text-neutral-900 leading-snug truncate">{request.itemName}</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {request.variant && <span className="mr-2">{request.variant}</span>}
            qty {request.quantity}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {locked && request.runnerQuote && (
            <span className="rounded-full bg-[#0a0a0a] px-2.5 py-1 text-xs font-black text-[#FF5C00]">
              {request.runnerQuote.toFixed(2)} XLM
            </span>
          )}
          <span className="text-neutral-300 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Status timeline — always visible */}
      <div className="px-5 pb-4">
        <RequestStatusTimeline status={request.requestStatus} />
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-neutral-100 px-5 pb-5 pt-4 space-y-4">
          {request.itemLink && (
            <a href={request.itemLink} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold text-[#FF5C00] underline underline-offset-4">
              View item link →
            </a>
          )}
          {request.notes && <p className="text-xs text-neutral-400 italic">"{request.notes}"</p>}
          {request.estimatedPrice && (
            <p className="text-xs text-neutral-300">Titiper estimate: ~{request.estimatedPrice} XLM</p>
          )}

          {/* Quote / locked display */}
          {request.runnerQuote !== null && (
            <div className={`flex items-center justify-between rounded-xl px-4 py-3
              ${locked ? 'bg-[#0a0a0a]' : 'bg-neutral-50 border border-neutral-100'}`}>
              <p className={`text-sm font-semibold ${locked ? 'text-neutral-500' : 'text-neutral-600'}`}>
                {locked ? 'Locked in escrow' : "Runner's all-in quote"}
              </p>
              <p className={`text-lg font-black ${locked ? 'text-[#FF5C00]' : 'text-neutral-900'}`}>
                {request.runnerQuote.toFixed(2)} XLM
              </p>
            </div>
          )}

          {/* Runner actions */}
          {runner && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Runner Actions</p>
              {(can as ReturnType<typeof runnerActions>).canApprove ? (
                <ApproveRequestPanel request={request} onComplete={onActionComplete} />
              ) : (
                <RunnerActionBar request={request} walletAddress={publicKey!} onComplete={onActionComplete} />
              )}
            </div>
          )}

          {/* Titiper actions */}
          {titiper && (
            <div className="space-y-2">
              {request.requestStatus === 'submitted' && (
                <p className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500">
                  Waiting for runner to review and send a quote.
                </p>
              )}
              {request.requestStatus === 'approved_waiting_payment' && (
                <FundEscrowPanel request={request} onFunded={onActionComplete} />
              )}
              {request.requestStatus === 'shipped' && (
                <ConfirmReceiptPanel requestId={request.requestId} onConfirmed={onActionComplete} />
              )}
              {request.requestStatus === 'refunded' && (
                <p className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500">Funds refunded to your wallet.</p>
              )}
              {request.requestStatus === 'completed' && (
                <p className="rounded-xl border border-green-100 bg-green-50 p-3 text-xs font-semibold text-green-700">
                  Delivered. Thank you for using Titipin.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
