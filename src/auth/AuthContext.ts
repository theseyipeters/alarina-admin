import { createContext } from 'react'
import type { Admin } from '../lib/types.ts'

export type AuthState = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; admin: Admin }

export type AuthContextValue = {
  state: AuthState
  signIn: (input: { email: string; password: string }) => Promise<void>
  /** After a setup link signs the person in. */
  signedIn: (admin: Admin) => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
