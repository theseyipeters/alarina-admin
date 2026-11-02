import { use } from 'react'
import { AuthContext } from './AuthContext.ts'

export function useAuth() {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

/** The signed-in staff member. Only for pages behind RequireAuth. */
export function useAdmin() {
  const { state } = useAuth()
  if (state.status !== 'signedIn') throw new Error('useAdmin needs a signed-in staff member')
  return state.admin
}
