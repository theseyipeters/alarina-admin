import { Link } from 'react-router'
import BarChart from '../components/BarChart.tsx'
import { CouplePill } from '../components/Pill.tsx'
import { KIND_LABEL } from '../lib/labels.ts'
import { daysUntil, formatCount, formatDay, formatNaira, formatNairaShort, plural, timeAgo } from '../lib/format.ts'
import type { GiftKind, Overview as Data } from '../lib/types.ts'
import { useApi } from '../lib/useApi.ts'
import { useTitle } from '../lib/useTitle.ts'

const KINDS: { kind: GiftKind; className: string }[] = [
  { kind: 'cash', className: 'seg-cash' },
  { kind: 'aso_ebi', className: 'seg-aso' },
  { kind: 'wishlist', className: 'seg-wish' },
]

export default function Overview() {
  useTitle('Overview')
  const { data, error } = useApi<Data>('/overview')

  if (error && !data) return <div className="alert" role="alert"><p>{error}</p></div>
  if (!data) return <p className="muted">Loading…</p>

  const { totals: t, trends, upcoming, recent, system } = data
  const replies = t.rsvps.attending + t.rsvps.declined + t.rsvps.rejected
  const weddings = t.weddings.draft + t.weddings.published
  const giftTotal = KINDS.reduce((s, k) => s + t.gifts.byKind[k.kind].amount, 0)
  const sum = (points: { value: number }[]) => points.reduce((s, p) => s + p.value, 0)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p>How Alárinà is doing, across every couple.</p>
        </div>
      </div>

      {t.pendingPayments > 0 && (
        <div className="alert alert--info" role="status">
          <p>
            {plural(t.pendingPayments, 'payment')} still pending. <Link to="/payments?status=pending">Review pending payments</Link>
          </p>
        </div>
      )}

      {t.marketplace.vendors.pending > 0 && (
        <div className="alert alert--info" role="status">
          <p>
            {plural(t.marketplace.vendors.pending, 'vendor listing')} waiting for review. <Link to="/vendors">Review listings</Link>
          </p>
        </div>
      )}

      <dl className="kpis">
        <div className="kpi">
          <dt>Couples</dt>
          <dd className="kpi-value">{formatCount(t.couples)}</dd>
          <dd className="kpi-sub">
            {plural(t.users, 'account')}
            {t.suspended > 0 && ` · ${formatCount(t.suspended)} suspended`}
          </dd>
        </div>
        <div className="kpi">
          <dt>Published invitations</dt>
          <dd className="kpi-value">{formatCount(t.weddings.published)}</dd>
          <dd className="kpi-sub">
            {weddings ? `${Math.round((t.weddings.published / weddings) * 100)}% of ${formatCount(weddings)} started` : 'None started yet'}
          </dd>
        </div>
        <div className="kpi">
          <dt>Guest replies</dt>
          <dd className="kpi-value">{formatCount(replies)}</dd>
          <dd className="kpi-sub">
            {formatCount(t.rsvps.attending)} attending · {formatCount(t.rsvps.declined)} declined
            {t.rsvps.rejected > 0 && ` · ${formatCount(t.rsvps.rejected)} rejected`}
          </dd>
        </div>
        <div className="kpi">
          <dt>Gifts to couples</dt>
          <dd className="kpi-value">{formatNairaShort(t.gifts.amount)}</dd>
          <dd className="kpi-sub">
            {plural(t.gifts.count, 'payment')} to {plural(t.gifts.weddings, 'couple')}
          </dd>
        </div>
        <div className="kpi">
          <dt>Gifts unlock revenue</dt>
          <dd className="kpi-value">{formatNairaShort(t.unlocks.revenue)}</dd>
          <dd className="kpi-sub">
            {formatCount(t.unlocks.paid)} paid · {formatCount(t.unlocks.comped)} granted free
          </dd>
        </div>
        <div className="kpi">
          <dt>Live vendors</dt>
          <dd className="kpi-value">{formatCount(t.marketplace.vendors.approved)}</dd>
          <dd className="kpi-sub">
            {formatCount(t.marketplace.vendors.pending)} waiting for review
            {t.marketplace.vendors.suspended > 0 && ` · ${formatCount(t.marketplace.vendors.suspended)} suspended`}
          </dd>
        </div>
        <div className="kpi">
          <dt>Paid to vendors</dt>
          <dd className="kpi-value">{formatNairaShort(t.marketplace.payments.amount)}</dd>
          <dd className="kpi-sub">
            {plural(t.marketplace.payments.count, 'payment')} · {plural(t.marketplace.bookings, 'accepted booking')}
          </dd>
        </div>
        <div className="kpi">
          <dt>Paystack fees paid by guests</dt>
          <dd className="kpi-value">{formatNairaShort(t.gifts.fees)}</dd>
          <dd className="kpi-sub">On top of what couples received</dd>
        </div>
      </dl>

      <div className="grid grid--3">
        <BarChart title="New couples" points={trends.signups} format={formatCount} total={formatCount(sum(trends.signups))} />
        <BarChart title="Guest replies" points={trends.rsvps} format={formatCount} total={formatCount(sum(trends.rsvps))} />
        <BarChart title="Gifts received" points={trends.gifts} format={formatNaira} total={formatNairaShort(sum(trends.gifts))} />
      </div>
      <p className="hint">Last {trends.days} days, Lagos time. Hover or tap a bar for the day.</p>

      <div className="grid grid--aside section">
        <section className="card" aria-labelledby="upcoming">
          <div className="section-head">
            <h2 id="upcoming">Weddings in the next 30 days</h2>
            <Link to="/couples?sort=wedding_date&status=published">See all</Link>
          </div>
          {upcoming.length ? (
            <ul className="list">
              {upcoming.map((w) => {
                const days = daysUntil(w.date)
                return (
                  <li key={w.coupleId}>
                    <span className="list-main">
                      <Link to={`/couples/${w.coupleId}`}>{w.names || 'Unnamed couple'}</Link>
                      <span>
                        {formatDay(w.date)}
                        {w.venueName && ` · ${w.venueName}`}
                      </span>
                    </span>
                    <span className="list-meta">
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                      <br />
                      {formatCount(w.attending)} of {plural(w.replies, 'reply', 'replies')} attending
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="muted">No published weddings in the next 30 days.</p>
          )}
        </section>

        <div className="stack">
          <section className="card" aria-labelledby="kinds">
            <h2 id="kinds">Gifts by kind</h2>
            {giftTotal ? (
              <>
                <div className="split" aria-hidden="true">
                  {KINDS.map(({ kind, className }) =>
                    t.gifts.byKind[kind].amount ? (
                      <span key={kind} className={className} style={{ flexGrow: t.gifts.byKind[kind].amount }} />
                    ) : null,
                  )}
                </div>
                <ul className="legend">
                  {KINDS.map(({ kind, className }) => (
                    <li key={kind} className={className}>
                      <i aria-hidden="true" />
                      <span>
                        {KIND_LABEL[kind]} <span className="muted">· {Math.round((t.gifts.byKind[kind].amount / giftTotal) * 100)}%</span>
                      </span>
                      <b>{formatNaira(t.gifts.byKind[kind].amount)}</b>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted">No gifts yet.</p>
            )}
          </section>

          <section className="card" aria-labelledby="system">
            <h2 id="system">Server setup</h2>
            <ul className="list checks">
              <Check ok={system.db} label="Database" detail={system.db ? 'Connected' : 'Down'} />
              <Check
                ok={system.paystack.configured}
                label="Paystack"
                detail={system.paystack.configured ? `${system.paystack.mode === 'live' ? 'Live' : 'Test'} key` : 'No key set'}
              />
              <Check ok={system.paystack.feesConfirmed} label="Fee maths confirmed" detail={system.paystack.feesConfirmed ? 'Yes' : 'Not yet'} />
              <Check ok={system.email} label="Email (Resend)" detail={system.email ? 'Sending' : 'Not set up'} />
            </ul>
            <p className="hint section">Environment: {system.environment}</p>
          </section>
        </div>
      </div>

      <section className="card" aria-labelledby="recent">
        <div className="section-head">
          <h2 id="recent">Newest couples</h2>
          <Link to="/couples">All couples</Link>
        </div>
        <ul className="list">
          {recent.map((c) => (
            <li key={c.id}>
              <span className="list-main">
                <Link to={`/couples/${c.id}`}>{c.names || c.members.map((m) => m.name).join(' & ')}</Link>
                <span>{c.members.map((m) => m.email).join(' · ')}</span>
              </span>
              <span className="list-meta">
                <CouplePill status={c.status} />
                <br />
                {timeAgo(c.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li>
      <span className={`check-dot${ok ? ' check-dot--ok' : ''}`} aria-hidden="true" />
      <span>{label}</span>
      <span className="list-meta">{detail}</span>
    </li>
  )
}
