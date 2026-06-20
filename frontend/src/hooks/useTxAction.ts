import { useState } from 'react'

type TxStatus = 'idle' | 'pending' | 'success' | 'error'

export function useTxAction<T extends unknown[]>(
  action: (...args: T) => Promise<unknown>,
  onSuccess?: () => void,
) {
  const [status, setStatus] = useState<TxStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  async function execute(...args: T) {
    setStatus('pending')
    setError(null)
    try {
      await action(...args)
      setStatus('success')
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return {
    execute,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    error,
    reset: () => { setStatus('idle'); setError(null) },
  }
}
