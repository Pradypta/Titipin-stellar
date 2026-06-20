import { Link } from 'react-router-dom'
import type { TitipGroup } from '../../types/group'

export function GroupCard({ group }: { group: TitipGroup }) {
  return (
    <div className="card flex flex-col p-6">
      {/* Top meta */}
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {group.groupStatus}
        </span>
        <span className="text-xs text-neutral-400">{new Date(group.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Title */}
      <h3 className="mb-1 text-lg font-black tracking-tight text-neutral-900 leading-snug">{group.title}</h3>
      <p className="mb-4 text-sm font-semibold text-[#FF5C00]">{group.sourceLocation}</p>
      <p className="mb-6 flex-1 text-sm text-neutral-500 leading-relaxed line-clamp-2">{group.description}</p>

      {/* Dates */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-neutral-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Purchase</p>
          <p className="text-sm font-bold text-neutral-800">{new Date(group.estimatedPurchaseDate).toLocaleDateString()}</p>
        </div>
        <div className="rounded-xl bg-neutral-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Delivery</p>
          <p className="text-sm font-bold text-neutral-800">{new Date(group.estimatedDeliveryDate).toLocaleDateString()}</p>
        </div>
      </div>

      <Link
        to={`/groups/${group.groupId}`}
        className="block rounded-xl bg-[#0a0a0a] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#FF5C00]"
      >
        View & Titip →
      </Link>
    </div>
  )
}
