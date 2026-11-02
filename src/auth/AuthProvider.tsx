import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api.ts'
import type { Admin } from '../lib/types.ts'
import { AuthContext, type AuthContextValue, type AuthState } from './AuthContext.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api.get<{ admin: Admin | null }>('/auth/me').then(
      ({ admin }) => !cancelled && setState(admin ? { status: 'signedIn', admin } : { status: 'signedOut' }),
      () => !cancelled && setState({ status: 'signedOut' }),
    )
    // Any request that finds the session gone (it expired, or a teammate disabled the account).
    const onSignedOut = () => setState({ status: 'signedOut' })
    window.addEventListener('admin:signed-out', onSignedOut)
    return () => {
      cancelled = true
      window.removeEventListener('admin:signed-out', onSignedOut)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      signIn: async (input) => {
        const { admin } = await api.post<{ admin: Admin }>('/auth/signin', input)
        setState({ status: 'signedIn', admin })
      },
      signedIn: (admin) => setState({ status: 'signedIn', admin }),
      signOut: async () => {
        await api.post('/auth/signout').catch(() => undefined)
        setState({ status: 'signedOut' })
      },
    }),
    [state],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
