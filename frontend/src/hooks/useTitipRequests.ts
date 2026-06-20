import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getRequestsByGroup, getRequestsByTitiper, getRequestById, getRequestsByRunner } from '../lib/storage'
import type { TitipRequest } from '../types/request'

export function useRequestsByGroup(groupId: string | undefined) {
  const [requests, setRequests] = useState<TitipRequest[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setRequests(groupId ? await getRequestsByGroup(groupId) : [])
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    refetch()
    if (!groupId) return

    // Live updates — fires whenever any request in this group changes
    const channel = supabase
      .channel(`requests-group-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'titipin_requests', filter: `group_id=eq.${groupId}` },
        () => { refetch() },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, refetch])

  return { requests, loading, refetch }
}

export function useRequestsByTitiper(titiperAddress: string | null) {
  const [requests, setRequests] = useState<TitipRequest[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setRequests(titiperAddress ? await getRequestsByTitiper(titiperAddress) : [])
    } finally {
      setLoading(false)
    }
  }, [titiperAddress])

  useEffect(() => {
    refetch()
    if (!titiperAddress) return

    // Live updates — fires whenever any of this titiper's requests change
    const channel = supabase
      .channel(`requests-titiper-${titiperAddress}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'titipin_requests', filter: `titiper_address=eq.${titiperAddress}` },
        () => { refetch() },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [titiperAddress, refetch])

  return { requests, loading, refetch }
}

/** All requests the runner owns — one query, one Realtime subscription, no per-group channels. */
export function useRunnerRequests(runnerAddress: string | null) {
  const [requests, setRequests] = useState<TitipRequest[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setRequests(runnerAddress ? await getRequestsByRunner(runnerAddress) : [])
    } finally {
      setLoading(false)
    }
  }, [runnerAddress])

  useEffect(() => {
    refetch()
    if (!runnerAddress) return

    const channel = supabase
      .channel(`requests-runner-${runnerAddress}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'titipin_requests', filter: `runner_address=eq.${runnerAddress}` },
        () => { refetch() },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [runnerAddress, refetch])

  return { requests, loading, refetch }
}

export function useRequest(requestId: string | undefined) {
  const [request, setRequest] = useState<TitipRequest | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      setRequest(requestId ? await getRequestById(requestId) : null)
    } finally {
      setLoading(false)
    }
  }, [requestId])

  useEffect(() => { refetch() }, [refetch])

  return { request, loading, refetch }
}
