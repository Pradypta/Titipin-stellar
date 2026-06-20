import type { TitipGroup } from '../types/group'
import type { TitipRequest, TitipRequestStatus } from '../types/request'

export function isGroupRunner(group: TitipGroup, publicKey: string | null): boolean {
  return !!publicKey && group.runnerAddress === publicKey
}

export function isRequestTitiper(request: TitipRequest, publicKey: string | null): boolean {
  return !!publicKey && request.titiperAddress === publicKey
}

export function runnerActions(status: TitipRequestStatus) {
  return {
    canApprove:         status === 'submitted',
    canReject:          status === 'submitted',
    canMarkUnavailable: status === 'funded',
    canMarkPurchased:   status === 'funded',
    canMarkShipped:     status === 'purchased',
    // canMarkCompleted intentionally omitted —
    // only the titiper can confirm receipt and release escrow
  }
}

export function titiperActions(status: TitipRequestStatus) {
  return {
    canFund:           status === 'approved_waiting_payment',
    canConfirmReceipt: status === 'shipped',
    isWaitingApproval: status === 'submitted',
    isRefunded:        status === 'refunded',
    isCompleted:       status === 'completed',
    isUnavailable:     status === 'unavailable',
  }
}

export const STATUS_LABELS: Record<TitipRequestStatus, string> = {
  submitted:                'Submitted',
  approved_waiting_payment: 'Awaiting Payment',
  funded:                   'Funded',
  unavailable:              'Unavailable',
  purchased:                'Purchased',
  shipped:                  'Shipped',
  completed:                'Delivered',
  refunded:                 'Refunded',
}

export const STATUS_COLORS: Record<TitipRequestStatus, string> = {
  submitted:                'bg-neutral-100 text-neutral-600',
  approved_waiting_payment: 'bg-blue-50 text-blue-700 border border-blue-200',
  funded:                   'bg-orange-50 text-orange-700 border border-orange-200',
  unavailable:              'bg-red-50 text-red-600 border border-red-200',
  purchased:                'bg-purple-50 text-purple-700 border border-purple-200',
  shipped:                  'bg-yellow-50 text-yellow-700 border border-yellow-200',
  completed:                'bg-green-50 text-green-700 border border-green-200',
  refunded:                 'bg-neutral-100 text-neutral-500',
}
