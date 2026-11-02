import { useState } from 'react'
import { Link, useParams } from 'react-router'
import ActionDialog from '../components/ActionDialog.tsx'
import { PaymentPill } from '../components/Pill.tsx'
import { KIND_LABEL } from '../lib/labels.ts'
import { api } from '../lib/api.ts'
import { describe } from '../lib/audit.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatCount, formatDateTime, formatDay, formatNaira, plural, timeAgo } from '../lib/format.ts'
import type { CoupleDetail as Data, GiftKind } from '../lib/types.ts'
import { useApi } from '../lib/useApi.ts'
import { useTitle } from '../lib/useTitle.ts'

type Action = 'suspend' | 'restore' | 'signout' | 'unlock' | 'lock'
type Tab = 'guests' | 'payments' | 'history'

const KINDS: GiftKind[] = ['cash', 'aso_ebi', 'wishlist']

export default function CoupleDetail() {
  const { id = '' } = useParams()
  const { data, error, reload } = useApi<Data>(`/couples/${id}`)
  const [action, setAction] = useState<Action | null>(null)
  const [tab, setTab] = useState<Tab>('guests')
  const [notice, setNotice] = useState<string | null>(null)
  const title = data ? data.wedding?.names || data.couple.members.map((m) => m.name).join(' & ') : 'Couple'
  useTitle(title)

  if (error && !data) {
    return (
      <>
        <Link to="/couples" className="back">← Couples</Link>
        <div className="alert" role="alert"><p>{error}</p></div>
      </>
    )
  }
  if (!data) return <p className="muted">Loading…</p>

  const { couple, wedding, stats } = data
  const suspended = Boolean(couple.suspendedAt)
  const sessions = couple.members.reduce((s, m) => s + m.activeSessions, 0)
  const paidUnlock = data.unlocks.find((u) => u.status === 'success' && !u.comp)

  async function run(kind: Action, reason: string) {
    const path = { suspend: 'suspend', restore: 'restore', signout: 'signout', unlock: 'gifts/unlock', lock: 'gifts/lock' }[kind]
    const res = await api.post<{ sessionsEnded?: number }>(`/couples/${id}/${path}`, { reason })
    setNotice(
      {
        suspend: 'Suspended. Their sessions have ended and their invitation is offline.',
        restore: 'Restored. They can sign in again, and their invitation is back online.',
        signout: `Signed out of ${plural(res.sessionsEnded ?? 0, 'session')}.`,
        unlock: 'Gifts unlocked. They can set up gifts now, at no charge.',
        lock: 'Gifts locked. Guests no longer see gifts for this wedding.',
      }[kind],
    )
    reload()
  }

  return (
    <>
      <Link to="/couples" className="back">← Couples</Link>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p>
            {wedding?.date ? formatDay(wedding.date) : 'No wedding date yet'}
            {wedding?.venueName && ` · ${wedding.venueName}`}
          </p>
        </div>
        <div className="pills">
          {suspended ? (
            <span className="pill pill--danger">Suspended</span>
          ) : wedding?.status === 'published' ? (
            <span className="pill pill--success">Published</span>
          ) : (
            <span className="pill">{wedding ? 'Draft' : 'Not started'}</span>
          )}
          {wedding?.giftsUnlockedAt && <span className="pill">Gifts unlocked</span>}
        </div>
      </div>

      {suspended && (
        <div className="alert" role="status">
          <p>
            Suspended {timeAgo(couple.suspendedAt)}: {couple.suspendedReason}. They can’t sign in, and guests can’t open their invitation.
          </p>
        </div>
      )}
      {notice && (
        <div className="alert alert--success" role="status">
          <p>{notice}</p>
        </div>
      )}

      <dl className="kpis">
        <div className="kpi">
          <dt>Replies</dt>
          <dd className="kpi-value">{formatCount(stats.replies.attending + stats.replies.declined)}</dd>
          <dd className="kpi-sub">
            {formatCount(stats.replies.attending)} attending · {formatCount(stats.replies.declined)} declined
          </dd>
        </div>
        {KINDS.map((k) => (
          <div className="kpi" key={k}>
            <dt>{KIND_LABEL[k]} received</dt>
            <dd className="kpi-value">{formatNaira(stats.gifts[k].amount)}</dd>
            <dd className="kpi-sub">{plural(stats.gifts[k].count, k === 'cash' ? 'gift' : 'order')}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid--aside">
        <div className="stack">
          <section className="card" aria-labelledby="people">
            <h2 id="people">People</h2>
            <ul className="list">
              {couple.members.map((m) => (
                <li key={m.id}>
                  <span className="list-main">
                    {m.name}
                    <span>
                      <a href={`mailto:${m.email}`}>{m.email}</a>
                    </span>
                  </span>
                  <span className="list-meta">
                    {m.lastSignInAt ? `Signed in ${timeAgo(m.lastSignInAt)}` : 'Not signed in'}
                    <br />
                    {plural(m.activeSessions, 'active session')}
                  </span>
                </li>
              ))}
              {couple.pendingInvite && (
                <li>
                  <span className="list-main">
                    Partner invite pending
                    <span>{couple.pendingInvite.email ?? 'Shared as a link'}</span>
                  </span>
                  <span className="list-meta">Expires {formatDateTime(couple.pendingInvite.expiresAt)}</span>
                </li>
              )}
            </ul>
            <p className="hint section">Joined {formatDateTime(couple.createdAt)}</p>
          </section>

          {wedding ? (
            <section className="card" aria-labelledby="wedding">
              <div className="section-head">
                <h2 id="wedding">Wedding</h2>
                {wedding.inviteUrl && wedding.status === 'published' && !suspended && (
                  <a href={wedding.inviteUrl} target="_blank" rel="noreferrer">
                    Open invitation
                  </a>
                )}
              </div>
              <dl className="kv">
                <div>
                  <dt>Names</dt>
                  <dd>{wedding.names || '—'}</dd>
                </div>
                <div>
                  <dt>Date and time</dt>
                  <dd>
                    {wedding.date ? formatDay(wedding.date) : '—'}
                    {wedding.startTime && `, ${wedding.startTime}`}
                    {wedding.events > 0 && <span className="muted"> · {plural(wedding.events, 'other event')}</span>}
                  </dd>
                </div>
                <div>
                  <dt>Venue</dt>
                  <dd>{[wedding.venueName, wedding.venueAddress].filter(Boolean).join(', ') || '—'}</dd>
                </div>
                <div>
                  <dt>Link</dt>
                  <dd className="mono">{wedding.slug ?? 'Not published yet'}</dd>
                </div>
                <div>
                  <dt>Published</dt>
                  <dd>{wedding.publishedAt ? formatDateTime(wedding.publishedAt) : 'Not yet'}</dd>
                </div>
                <div>
                  <dt>Design</dt>
                  <dd>
                    {wedding.template} layout, {wedding.palette} palette
                  </dd>
                </div>
                <div>
                  <dt>Gifts</dt>
                  <dd>
                    {wedding.giftsUnlockedAt ? `Unlocked ${formatDateTime(wedding.giftsUnlockedAt)}` : 'Locked'}
                    {wedding.giftsClosed && ' · closed (wedding has passed)'}
                    <br />
                    <span className="muted">
                      Cash {wedding.switches.cash ? 'on' : 'off'} · Aso-ebi {wedding.switches.asoEbi ? 'on' : 'off'} ({formatCount(wedding.items.asoEbi)}) · Wishlist{' '}
                      {wedding.switches.wishlist ? 'on' : 'off'} ({formatCount(wedding.items.wishlist)})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Payout account</dt>
                  <dd>
                    {wedding.payout ? (
                      <>
                        {wedding.payout.bankName} •••• {wedding.payout.accountLast4}
                        <br />
                        <span className="muted">{wedding.payout.accountName}</span>
                      </>
                    ) : (
                      'Not added'
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          ) : (
            <section className="card">
              <h2>Wedding</h2>
              <p className="muted">They haven’t started setting up their wedding yet.</p>
            </section>
          )}
        </div>

        <section className="card" aria-labelledby="actions">
          <h2 id="actions">Actions</h2>
          <div className="action-list">
            <div className="action-item">
              {suspended ? (
                <>
                  <p>Let them sign in again and put their invitation back online.</p>
                  <button className="btn btn--secondary btn--sm" onClick={() => setAction('restore')}>
                    Restore couple
                  </button>
                </>
              ) : (
                <>
                  <p>Block sign-in and take their invitation offline. You can restore them later.</p>
                  <button className="btn btn--danger btn--sm" onClick={() => setAction('suspend')}>
                    Suspend couple
                  </button>
                </>
              )}
            </div>
            <div className="action-item">
              <p>End every session for both partners, such as after a password leak. They can sign in again.</p>
              <button className="btn btn--secondary btn--sm" onClick={() => setAction('signout')} disabled={!sessions}>
                {sessions ? `Sign out (${formatCount(sessions)})` : 'No active sessions'}
              </button>
            </div>
            {wedding && (
              <div className="action-item">
                {wedding.giftsUnlockedAt ? (
                  <>
                    <p>Take Gifts away. Guests stop seeing gifts; what they received stays on record.</p>
                    <button className="btn btn--secondary btn--sm" onClick={() => setAction('lock')}>
                      Lock Gifts
                    </button>
                  </>
                ) : (
                  <>
                    <p>Give them Gifts without the ₦5,000 payment.{wedding.giftsClosed && ' Not possible: their wedding has passed.'}</p>
                    <button className="btn btn--secondary btn--sm" onClick={() => setAction('unlock')} disabled={wedding.giftsClosed}>
                      Unlock Gifts free
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="subnav" role="tablist" aria-label="Couple records">
        {(
          [
            ['guests', `Guests (${formatCount(data.rsvps.length)})`],
            ['payments', `Payments (${formatCount(data.payments.length + data.unlocks.length)})`],
            ['history', `Staff history (${formatCount(data.history.length)})`],
          ] as const
        ).map(([key, label]) => (
          <button key={key} role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'guests' && <Guests data={data} />}
        {tab === 'payments' && <Payments data={data} onChange={reload} />}
        {tab === 'history' &&
          (data.history.length ? (
            <ol className="timeline">
              {data.history.map((h) => (
                <li key={h.id}>
                  <span className="timeline-what">{describe(h)}</span>
                  {h.reason && <q className="timeline-why">{h.reason}</q>}
                  <span className="timeline-meta">
                    {h.admin.name} · {formatDateTime(h.createdAt)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty">No staff have acted on this couple.</p>
          ))}
      </div>

      <ActionDialog
        open={action === 'suspend'}
        title="Suspend this couple?"
        confirmLabel="Suspend"
        busyLabel="Suspending…"
        danger
        onConfirm={(r) => run('suspend', r)}
        onClose={() => setAction(null)}
      >
        <p>
          Both partners are signed out and can’t sign back in. Guests can’t open the invitation or give gifts. Payments already made
          still settle.
        </p>
      </ActionDialog>
      <ActionDialog open={action === 'restore'} title="Restore this couple?" confirmLabel="Restore" busyLabel="Restoring…" onConfirm={(r) => run('restore', r)} onClose={() => setAction(null)}>
        <p>They can sign in again, and their invitation goes back online.</p>
      </ActionDialog>
      <ActionDialog open={action === 'signout'} title="Sign them out everywhere?" confirmLabel="Sign out" busyLabel="Signing out…" onConfirm={(r) => run('signout', r)} onClose={() => setAction(null)}>
        <p>Ends {plural(sessions, 'session')} for both partners. Their wedding isn’t affected.</p>
      </ActionDialog>
      <ActionDialog open={action === 'unlock'} title="Unlock Gifts for free?" confirmLabel="Unlock Gifts" busyLabel="Unlocking…" onConfirm={(r) => run('unlock', r)} onClose={() => setAction(null)}>
        <p>They get cash gifts, aso-ebi and the wishlist without paying ₦5,000. It’s recorded as a ₦0 unlock, so revenue stays accurate.</p>
      </ActionDialog>
      <ActionDialog open={action === 'lock'} title="Lock Gifts?" confirmLabel="Lock Gifts" busyLabel="Locking…" danger onConfirm={(r) => run('lock', r)} onClose={() => setAction(null)}>
        <p>Guests stop seeing gifts, and the couple can’t change gift settings until Gifts is unlocked again.</p>
        {paidUnlock && (
          <p>
            They paid {formatNaira(paidUnlock.charge)} on {formatDateTime(paidUnlock.paidAt)}. Locking doesn’t refund it: do that in Paystack (
            <span className="mono">{paidUnlock.reference}</span>).
          </p>
        )}
      </ActionDialog>
    </>
  )
}

function Guests({ data }: { data: Data }) {
  if (!data.rsvps.length) return <p className="empty">No guest replies yet.</p>
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Guest</th>
            <th scope="col">Phone</th>
            <th scope="col">Reply</th>
            <th scope="col">Side</th>
            <th scope="col">Replied</th>
          </tr>
        </thead>
        <tbody>
          {data.rsvps.map((r) => (
            <tr key={r.id}>
              <th scope="row">
                <span className="cell-main">
                  {r.name}
                  <span className="cell-sub">{r.email}</span>
                </span>
              </th>
              <td data-label="Phone">{r.phone}</td>
              <td data-label="Reply">
                <span className={`pill${r.attending ? ' pill--success' : ''}`}>{r.attending ? 'Attending' : 'Declined'}</span>
              </td>
              <td data-label="Side">{r.side ?? <span className="muted">Not set</span>}</td>
              <td data-label="Replied">{formatDateTime(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.rsvps.length >= 500 && <p className="hint">Showing the latest 500 replies.</p>}
    </div>
  )
}

function Payments({ data, onChange }: { data: Data; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function recheck(type: 'gifts' | 'unlocks', paymentId: string) {
    setBusy(paymentId)
    setMessage(null)
    try {
      const res = await api.post<{ status: string; changed: boolean }>(`/payments/${type}/${paymentId}/recheck`)
      setMessage({ ok: true, text: res.changed ? `Paystack says this payment is now ${res.status}. Updated.` : `Paystack still has it as ${res.status}. Nothing changed.` })
      onChange()
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) })
    } finally {
      setBusy(null)
    }
  }

  if (!data.payments.length && !data.unlocks.length) return <p className="empty">No payments yet.</p>

  return (
    <div className="stack">
      {message && (
        <div className={`alert${message.ok ? ' alert--success' : ''}`} role={message.ok ? 'status' : 'alert'}>
          <p>{message.text}</p>
        </div>
      )}
      {data.unlocks.length > 0 && (
        <section aria-labelledby="unlocks">
          <h2 id="unlocks" className="section-head">Gifts unlock</h2>
          <ul className="list">
            {data.unlocks.map((u) => (
              <li key={u.id}>
                <span className="list-main">
                  {u.comp ? `Granted free by ${u.grantedBy ?? 'staff'}` : formatNaira(u.charge)}
                  <span>
                    <span className="mono">{u.reference}</span> · {formatDateTime(u.paidAt ?? u.createdAt)}
                    {u.note && ` · “${u.note}”`}
                  </span>
                </span>
                <span className="list-meta actions">
                  <PaymentPill status={u.status} />
                  {u.status !== 'success' && !u.comp && (
                    <button className="btn btn--secondary btn--sm" disabled={busy === u.id} onClick={() => recheck('unlocks', u.id)}>
                      {busy === u.id ? 'Checking…' : 'Re-check'}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {data.payments.length > 0 && (
        <section aria-labelledby="gifts">
          <h2 id="gifts" className="section-head">Guest payments</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Guest</th>
                  <th scope="col">Kind</th>
                  <th scope="col" className="num">Couple gets</th>
                  <th scope="col" className="num">Guest paid</th>
                  <th scope="col">Status</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id}>
                    <th scope="row">
                      <span className="cell-main">
                        {p.guestName}
                        <span className="cell-sub">
                          {p.guestEmail}
                          {p.guestPhone && ` · ${p.guestPhone}`}
                        </span>
                        <span className="cell-sub mono">{p.reference}</span>
                      </span>
                    </th>
                    <td data-label="Kind">{p.kinds.map((k) => KIND_LABEL[k]).join(', ')}</td>
                    <td data-label="Couple gets" className="num">{formatNaira(p.amount)}</td>
                    <td data-label="Guest paid" className="num">
                      {formatNaira(p.charge)}
                      <span className="cell-sub">fee {formatNaira(p.fee)}</span>
                    </td>
                    <td data-label="Status">
                      <span className="cell-main">
                        <PaymentPill status={p.status} />
                        {p.status !== 'success' && (
                          <button className="link-button cell-sub" disabled={busy === p.id} onClick={() => recheck('gifts', p.id)}>
                            {busy === p.id ? 'Checking…' : 'Re-check'}
                          </button>
                        )}
                      </span>
                    </td>
                    <td data-label="When">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
