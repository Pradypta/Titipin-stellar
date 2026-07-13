import { useEffect, useState } from 'react'
import { getRunnerStats, type RunnerReputation } from '../contract/escrowService'

interface Props {
  runnerAddress: string
  /** Source account for the read-only simulation. Defaults to the runner. */
  viewerAddress?: string | null
  className?: string
}

/**
 * Compact on-chain reputation badge for a runner:
 *   ⭐ 4.7 (23) · 96% reliable
 * Reads from the reputation contract (a free simulation, no signature).
 * Falls back to a "New runner" pill when there's no history yet.
 */
export function RunnerReputationBadge({ runnerAddress, viewerAddress, className }: Props) {
  const [stats, setStats] = useState<RunnerReputation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    // The runner's own account is guaranteed to exist on-chain, so it's a safe
    // default source for the simulation when no viewer wallet is connected.
    getRunnerStats(runnerAddress, viewerAddress || runnerAddress)
      .then((s) => alive && setStats(s))
      .catch(() => alive && setStats(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [runnerAddress, viewerAddress])

  if (loading) {
    return <span className={`inline-block h-5 w-32 animate-pulse rounded-full bg-neutral-100 ${className ?? ''}`} />
  }

  const hasHistory = stats && (stats.completed > 0 || stats.refunded > 0)
  if (!hasHistory) {
    return (
      <span className={`inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500 ${className ?? ''}`}>
        ✦ New runner
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ${className ?? ''}`}
      title={`${stats.completed} completed · ${stats.refunded} refunded · ${stats.ratingCount} rating${stats.ratingCount === 1 ? '' : 's'}`}
    >
      {stats.ratingCount > 0 ? (
        <span className="text-amber-500">★ {stats.averageRating.toFixed(1)}</span>
      ) : (
        <span className="text-neutral-400">☆ unrated</span>
      )}
      {stats.ratingCount > 0 && <span className="text-amber-700/70">({stats.ratingCount})</span>}
      <span className="text-amber-300">·</span>
      <span className="text-green-700">{stats.reliability}% reliable</span>
    </span>
  )
}
