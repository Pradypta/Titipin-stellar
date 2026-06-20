import type { TitipRequestStatus } from '../types/request'
import { STATUS_LABELS, STATUS_COLORS } from '../lib/roles'

export function StatusBadge({ status }: { status: TitipRequestStatus }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
