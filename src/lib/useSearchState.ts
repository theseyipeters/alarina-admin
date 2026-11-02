import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Filters kept in the address bar, so a filtered list can be bookmarked, shared with a teammate,
 * and survives going back from a detail page. Changing any filter but the page goes back to page 1.
 */
export function useSearchState<K extends string>(defaults: Record<K, string>) {
  const [params, setParams] = useSearchParams()
  const values = Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => [k, params.get(k) ?? v]),
  ) as Record<K, string>

  const set = useCallback(
    (changes: Partial<Record<K, string>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(changes) as [K, string][]) {
            if (!v || v === defaults[k]) next.delete(k)
            else next.set(k, v)
          }
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults are a constant per page
    [setParams],
  )

  return [values, set] as const
}
