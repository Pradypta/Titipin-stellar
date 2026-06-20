import { useCallback, useEffect, useState } from 'react'
import { getOpenGroups, getGroupsByRunner } from '../lib/storage'
import type { TitipGroup } from '../types/group'

export function useTitipGroups() {
  const [groups, setGroups] = useState<TitipGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setGroups(await getOpenGroups())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return { groups, loading, error, refetch }
}

export function useRunnerGroups(runnerAddress: string | null) {
  const [groups, setGroups] = useState<TitipGroup[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setGroups(runnerAddress ? await getGroupsByRunner(runnerAddress) : [])
    } finally {
      setLoading(false)
    }
  }, [runnerAddress])

  useEffect(() => { refetch() }, [refetch])

  return { groups, loading, refetch }
}
