import { useState, useCallback, useEffect } from 'react'
import { backend, BackendError } from '../services'
import type { SessionInfo } from '../types/domain'

/**
 * Single source of client auth state. Components read from here;
 * they never touch the adapter directly for session state.
 */
export function useSession() {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      setSession(await backend.auth.getSession())
    } catch (e) {
      setSession(null)
      setError(e instanceof BackendError ? e.message : 'Could not check your sign-in status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { session, loading, error, refresh }
}
