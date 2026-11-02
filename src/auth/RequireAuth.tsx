import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './useAuth.ts'

/** Gate for every staff page. Remembers where they were headed so sign-in can return them. */
export default function RequireAuth() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') return <p className="main muted">Loading…</p>
  if (state.status === 'signedOut') {
    const next = location.pathname + location.search
    return <Navigate to={next === '/' ? '/signin' : `/signin?next=${encodeURIComponent(next)}`} replace />
  }
  return <Outlet />
}
