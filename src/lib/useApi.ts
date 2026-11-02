import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from './errors.ts'
import { api } from './api.ts'

type State<T> = { key: string | null; data: T | null; error: string | null }

/**
 * Loads `path` and reloads whenever it changes. The previous data stays on screen while the next
 * page or filter loads, so tables don't flash empty. `reload` fetches again after an action.
 */
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<State<T>>({ key: null, data: null, error: null })
  const [tick, setTick] = useState(0)
  const key = path && `${path}#${tick}`

  useEffect(() => {
    if (!path || !key) return
    let cancelled = false
    api.get<T>(path).then(
      (data) => !cancelled && setState({ key, data, error: null }),
      (err: unknown) => !cancelled && setState((s) => ({ ...s, key, error: errorMessage(err) })),
    )
    return () => {
      cancelled = true
    }
  }, [path, key])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  // Loading until the response for the current path (and reload) has arrived.
  return { data: state.data, error: state.error, loading: Boolean(key) && state.key !== key, reload }
}
