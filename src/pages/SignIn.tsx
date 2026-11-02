import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import Field from '../components/Field.tsx'
import Logo from '../components/Logo.tsx'
import { errorMessage } from '../lib/errors.ts'
import { useTitle } from '../lib/useTitle.ts'

/** Only same-app paths, so a crafted ?next= can't send staff to another site. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/')

export default function SignIn() {
  useTitle('Sign in')
  const { state, signIn } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (state.status === 'signedIn') return <Navigate to={safeNext(params.get('next'))} replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn({ email, password })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <main id="main" className="auth">
      <div className="card">
        <div className="auth-head">
          <span className="brand"><Logo /></span>
          <span className="badge">Admin</span>
        </div>
        <h1>Staff sign in</h1>
        <p className="muted">For the Alárinà team. Couples sign in on the main site.</p>
        {error && (
          <div className="alert" role="alert">
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={submit}>
          <Field label="Email">
            {(p) => <input {...p} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Password">
            {(p) => (
              <div className="password-field">
                <input
                  {...p}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="link-button password-toggle" onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            )}
          </Field>
          <button className="btn btn--block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="form-footer">Forgot your password? Ask a teammate for a new setup link.</p>
      </div>
    </main>
  )
}
