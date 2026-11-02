import { useState } from 'react'
import ActionDialog from '../components/ActionDialog.tsx'
import Field from '../components/Field.tsx'
import { api } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatDateTime, timeAgo } from '../lib/format.ts'
import type { SetupLink, Staff as Member } from '../lib/types.ts'
import { useApi } from '../lib/useApi.ts'
import { useTitle } from '../lib/useTitle.ts'

/** The Alárinà team: add teammates, send setup links, disable accounts, change your own password. */
export default function Staff() {
  useTitle('Staff')
  const { data, error, reload } = useApi<{ staff: Member[] }>('/staff')
  const [link, setLink] = useState<(SetupLink & { name: string }) | null>(null)
  const [confirm, setConfirm] = useState<{ member: Member; kind: 'disable' | 'enable' } | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)

  async function newLink(m: Member) {
    setRowError(null)
    try {
      const { setup } = await api.post<{ setup: SetupLink }>(`/staff/${m.id}/setup-link`)
      setLink({ ...setup, name: m.name })
      reload()
    } catch (err) {
      setRowError(errorMessage(err))
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Staff</h1>
          <p>Everyone here can do everything in the admin app. Every action is kept in Activity.</p>
        </div>
      </div>

      {link && <LinkNotice link={link} onDismiss={() => setLink(null)} />}
      {(error || rowError) && <div className="alert" role="alert"><p>{error ?? rowError}</p></div>}

      <div className="grid grid--aside">
        <section className="card" aria-labelledby="team">
          <h2 id="team">Team</h2>
          {data ? (
            <ul className="list">
              {data.staff.map((m) => (
                <li key={m.id}>
                  <span className="list-main">
                    <span>
                      {m.name}
                      {m.isYou && <span className="muted"> (you)</span>}
                    </span>
                    <span>{m.email}</span>
                    <span>
                      {m.disabledAt
                        ? `Disabled ${timeAgo(m.disabledAt)}`
                        : m.pendingSetup
                          ? `Hasn’t chosen a password yet${m.setupExpiresAt ? ` · link expires ${formatDateTime(m.setupExpiresAt)}` : ''}`
                          : m.lastSignInAt
                            ? `Signed in ${timeAgo(m.lastSignInAt)}`
                            : 'Never signed in'}
                    </span>
                  </span>
                  <span className="list-meta actions">
                    {m.disabledAt ? (
                      <button className="btn btn--secondary btn--sm" onClick={() => setConfirm({ member: m, kind: 'enable' })}>
                        Enable
                      </button>
                    ) : (
                      <>
                        {!m.isYou && (
                          <button className="btn btn--secondary btn--sm" onClick={() => newLink(m)}>
                            {m.pendingSetup ? 'New setup link' : 'Reset password'}
                          </button>
                        )}
                        {!m.isYou && (
                          <button className="btn btn--danger btn--sm" onClick={() => setConfirm({ member: m, kind: 'disable' })}>
                            Disable
                          </button>
                        )}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Loading…</p>
          )}
        </section>

        <div className="stack">
          <AddStaff
            onAdded={(setup, name) => {
              setLink({ ...setup, name })
              reload()
            }}
          />
          <ChangePassword />
        </div>
      </div>

      <ActionDialog
        open={confirm !== null}
        title={confirm?.kind === 'disable' ? `Disable ${confirm.member.name}?` : `Enable ${confirm?.member.name ?? ''}?`}
        confirmLabel={confirm?.kind === 'disable' ? 'Disable' : 'Enable'}
        busyLabel={confirm?.kind === 'disable' ? 'Disabling…' : 'Enabling…'}
        danger={confirm?.kind === 'disable'}
        askReason={false}
        onConfirm={async () => {
          await api.post(`/staff/${confirm!.member.id}/${confirm!.kind}`)
          reload()
        }}
        onClose={() => setConfirm(null)}
      >
        <p>
          {confirm?.kind === 'disable'
            ? 'They’re signed out straight away and can’t sign in again until someone enables their account.'
            : 'They can sign in again with their existing password.'}
        </p>
      </ActionDialog>
    </>
  )
}

function LinkNotice({ link, onDismiss }: { link: SetupLink & { name: string }; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="alert alert--success" role="status">
      <p>
        {link.emailSent ? `We emailed ${link.name} a setup link.` : `Email isn’t set up, so send ${link.name} this link yourself.`} It works once, until{' '}
        {formatDateTime(link.expiresAt)}.
      </p>
      <div className="link-box section">
        <input type="text" readOnly value={link.link} aria-label="Setup link" onFocus={(e) => e.currentTarget.select()} />
        <button
          className="btn btn--secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(link.link)
            setCopied(true)
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button className="link-button" onClick={onDismiss}>
        Done
      </button>
    </div>
  )
}

function AddStaff({ onAdded }: { onAdded: (setup: SetupLink, name: string) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { setup } = await api.post<{ setup: SetupLink }>('/staff', { name, email })
      onAdded(setup, name)
      setName('')
      setEmail('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card" aria-labelledby="add">
      <h2 id="add">Add a teammate</h2>
      <p className="muted">They get a link to choose their own password.</p>
      {error && <div className="alert" role="alert"><p>{error}</p></div>}
      <form onSubmit={submit}>
        <Field label="Name">{(p) => <input {...p} type="text" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Obi" />}</Field>
        <Field label="Work email">
          {(p) => <input {...p} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ada@alarina.ng" />}
        </Field>
        <button className="btn" disabled={busy}>
          {busy ? 'Adding…' : 'Add teammate'}
        </button>
      </form>
    </section>
  )
}

function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 12) {
      setError('Use at least 12 characters.')
      return
    }
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      await api.post('/auth/password', { current, password })
      setDone(true)
      setCurrent('')
      setPassword('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card" aria-labelledby="password">
      <h2 id="password">Your password</h2>
      {done && (
        <div className="alert alert--success" role="status">
          <p>Password changed. Your other devices have been signed out.</p>
        </div>
      )}
      {error && <div className="alert" role="alert"><p>{error}</p></div>}
      <form onSubmit={submit} noValidate>
        <Field label="Current password">
          {(p) => <input {...p} type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />}
        </Field>
        <Field label="New password" hint="At least 12 characters.">
          {(p) => <input {...p} type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <button className="btn btn--secondary" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </section>
  )
}
