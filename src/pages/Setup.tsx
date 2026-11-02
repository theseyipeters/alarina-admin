import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import Field from '../components/Field.tsx'
import Logo from '../components/Logo.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import type { Admin } from '../lib/types.ts'
import { useTitle } from '../lib/useTitle.ts'

const MIN = 12

/** Where a new staff member (or one given a fresh link) chooses their password. */
export default function Setup() {
  useTitle('Choose a password')
  const { token = '' } = useParams()
  const { signedIn } = useAuth()
  const navigate = useNavigate()
  const [who, setWho] = useState<{ name: string; email: string } | null>(null)
  const [dead, setDead] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get<{ name: string; email: string }>(`/auth/setup/${encodeURIComponent(token)}`).then(setWho, (err: unknown) => setDead(errorMessage(err)))
  }, [token])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < MIN) {
      setError(`Use at least ${MIN} characters.`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { admin } = await api.post<{ admin: Admin }>('/auth/setup', { token, password })
      signedIn(admin)
      navigate('/', { replace: true })
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
        {dead ? (
          <>
            <h1>Link not working</h1>
            <div className="alert" role="alert">
              <p>{dead}</p>
            </div>
            <Link to="/signin">Go to sign in</Link>
          </>
        ) : !who ? (
          <p className="muted">Checking your link…</p>
        ) : (
          <>
            <h1>Choose a password</h1>
            <p className="muted">
              Hi {who.name}. You’ll sign in as <span className="break-anywhere">{who.email}</span>.
            </p>
            <form onSubmit={submit} noValidate>
              <input type="email" autoComplete="username" value={who.email} readOnly hidden />
              <Field label="New password" hint={`At least ${MIN} characters. A passphrase works well.`} error={error}>
                {(p) => (
                  <input {...p} type="password" autoComplete="new-password" required minLength={MIN} value={password} onChange={(e) => setPassword(e.target.value)} />
                )}
              </Field>
              <button className="btn btn--block" disabled={busy}>
                {busy ? 'Saving…' : 'Save and sign in'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
