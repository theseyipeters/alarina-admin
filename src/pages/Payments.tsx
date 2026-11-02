import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Pager from '../components/Pager.tsx'
import { PaymentPill } from '../components/Pill.tsx'
import { KIND_LABEL } from '../lib/labels.ts'
import { api, query } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { formatDateTime, formatNaira, plural } from '../lib/format.ts'
import type { GiftPayment, Paged, UnlockRow } from '../lib/types.ts'
import { useApi } from '../lib/useApi.ts'
import { useSearchState } from '../lib/useSearchState.ts'
import { useTitle } from '../lib/useTitle.ts'

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'abandoned', label: 'Abandoned' },
]

const KINDS = [
  { value: 'all', label: 'Every kind' },
  { value: 'cash', label: 'Cash' },
  { value: 'aso_ebi', label: 'Aso-ebi' },
  { value: 'wishlist', label: 'Wishlist' },
]

const SOURCES = [
  { value: 'all', label: 'Paid and granted' },
  { value: 'paid', label: 'Paid by couple' },
  { value: 'comp', label: 'Granted by staff' },
]

const DEFAULTS = { type: 'gifts', q: '', status: 'all', kind: 'all', source: 'all', page: '1' }

type GiftsPage = Paged<GiftPayment> & { summary: { received: number; fees: number; succeeded: number } }
type UnlocksPage = Paged<UnlockRow> & { summary: { revenue: number; succeeded: number } }

export default function Payments() {
  useTitle('Payments')
  const [f, set] = useSearchState(DEFAULTS)
  const [search, setSearch] = useState(f.q)
  const gifts = f.type !== 'unlocks'
  const qs = query({ q: f.q, status: f.status, ...(gifts ? { kind: f.kind } : { source: f.source }), page: f.page === '1' ? undefined : f.page })
  const { data, error, loading, reload } = useApi<GiftsPage | UnlocksPage>(`/payments/${gifts ? 'gifts' : 'unlocks'}${qs}`)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => search !== f.q && set({ q: search }), 300)
    return () => clearTimeout(t)
  }, [search, f.q, set])

  async function recheck(id: string) {
    setBusy(id)
    setMessage(null)
    try {
      const res = await api.post<{ status: string; changed: boolean }>(`/payments/${gifts ? 'gifts' : 'unlocks'}/${id}/recheck`)
      setMessage({ ok: true, text: res.changed ? `Paystack says it’s now ${res.status}. Updated.` : `Paystack still has it as ${res.status}. Nothing changed.` })
      reload()
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) })
    } finally {
      setBusy(null)
    }
  }

  // Only the current tab's data is the right shape; ignore a stale page from the other tab while loading.
  const giftData = gifts && data && 'summary' in data && 'received' in data.summary ? (data as GiftsPage) : null
  const unlockData = !gifts && data && 'summary' in data && 'revenue' in data.summary ? (data as UnlocksPage) : null

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Payments</h1>
          <p>Guests’ gifts to couples, and couples’ Gifts unlock payments to Alárinà.</p>
        </div>
      </div>

      <div className="subnav" role="tablist" aria-label="Payment type">
        <button role="tab" aria-selected={gifts} onClick={() => set({ type: 'gifts', source: 'all' })}>
          Guest gifts
        </button>
        <button role="tab" aria-selected={!gifts} onClick={() => set({ type: 'unlocks', kind: 'all' })}>
          Gifts unlocks
        </button>
      </div>

      <div className="filters">
        <input
          className="search"
          type="search"
          aria-label="Search payments"
          placeholder={gifts ? 'Guest, email, couple or reference' : 'Couple or reference'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="chips" role="group" aria-label="Status">
          {STATUSES.map((s) => (
            <button key={s.value} type="button" className="chip" aria-pressed={f.status === s.value} onClick={() => set({ status: s.value })}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label={gifts ? 'Kind' : 'Source'}>
          {(gifts ? KINDS : SOURCES).map((s) => (
            <button
              key={s.value}
              type="button"
              className="chip"
              aria-pressed={(gifts ? f.kind : f.source) === s.value}
              onClick={() => set(gifts ? { kind: s.value } : { source: s.value })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert" role="alert"><p>{error}</p></div>}
      {message && (
        <div className={`alert${message.ok ? ' alert--success' : ''}`} role={message.ok ? 'status' : 'alert'}>
          <p>{message.text}</p>
        </div>
      )}

      {giftData && (
        <div aria-busy={loading}>
          <p className="muted">
            {formatNaira(giftData.summary.received)} paid to couples across {plural(giftData.summary.succeeded, 'payment')} in this view, plus{' '}
            {formatNaira(giftData.summary.fees)} in Paystack fees covered by guests.
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Guest</th>
                  <th scope="col">Couple</th>
                  <th scope="col">What</th>
                  <th scope="col" className="num">Couple gets</th>
                  <th scope="col" className="num">Guest paid</th>
                  <th scope="col">Status</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {giftData.items.map((p) => (
                  <tr key={p.id}>
                    <th scope="row">
                      <span className="cell-main">
                        {p.guestName}
                        <span className="cell-sub">{p.guestEmail}</span>
                        <span className="cell-sub mono">{p.reference}</span>
                      </span>
                    </th>
                    <td data-label="Couple">
                      {p.wedding ? <Link to={`/couples/${p.wedding.coupleId}`}>{p.wedding.names || 'Unnamed'}</Link> : <span className="muted">Deleted</span>}
                    </td>
                    <td data-label="What">
                      <span className="cell-main">
                        {p.lines.map((l, i) => (
                          <span key={i} className={i ? 'cell-sub' : undefined}>
                            {KIND_LABEL[l.kind]}
                            {l.itemName && `: ${l.itemName}`}
                            {l.quantity && ` × ${l.quantity}${l.unit ? ` ${l.unit}` : ''}`} · {formatNaira(l.amount)}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td data-label="Couple gets" className="num">{formatNaira(p.amount)}</td>
                    <td data-label="Guest paid" className="num">
                      {formatNaira(p.charge)}
                      <span className="cell-sub">fee {formatNaira(p.fee)}</span>
                    </td>
                    <td data-label="Status">
                      <span className="cell-main">
                        <PaymentPill status={p.status} />
                        {p.status !== 'success' && (
                          <button className="link-button cell-sub" disabled={busy === p.id} onClick={() => recheck(p.id)}>
                            {busy === p.id ? 'Checking…' : 'Re-check with Paystack'}
                          </button>
                        )}
                      </span>
                    </td>
                    <td data-label="When">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!giftData.items.length && <p className="empty">No payments match.</p>}
          </div>
          <Pager page={giftData.page} pageSize={giftData.pageSize} total={giftData.total} noun="payments" onPage={(p) => set({ page: String(p) })} />
        </div>
      )}

      {unlockData && (
        <div aria-busy={loading}>
          <p className="muted">
            {formatNaira(unlockData.summary.revenue)} revenue from {plural(unlockData.summary.succeeded, 'successful unlock')} in this view.
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Couple</th>
                  <th scope="col">Reference</th>
                  <th scope="col" className="num">Charge</th>
                  <th scope="col">Source</th>
                  <th scope="col">Status</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {unlockData.items.map((u) => (
                  <tr key={u.id}>
                    <th scope="row">
                      {u.wedding ? <Link to={`/couples/${u.wedding.coupleId}`}>{u.wedding.names || 'Unnamed'}</Link> : <span className="muted">Deleted</span>}
                    </th>
                    <td data-label="Reference" className="mono">{u.reference}</td>
                    <td data-label="Charge" className="num">{formatNaira(u.charge)}</td>
                    <td data-label="Source">
                      <span className="cell-main">
                        {u.comp ? `Granted by ${u.grantedBy ?? 'staff'}` : 'Paid by couple'}
                        {u.note && <span className="cell-sub">“{u.note}”</span>}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className="cell-main">
                        <PaymentPill status={u.status} />
                        {u.status !== 'success' && !u.comp && (
                          <button className="link-button cell-sub" disabled={busy === u.id} onClick={() => recheck(u.id)}>
                            {busy === u.id ? 'Checking…' : 'Re-check with Paystack'}
                          </button>
                        )}
                      </span>
                    </td>
                    <td data-label="When">{formatDateTime(u.paidAt ?? u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!unlockData.items.length && <p className="empty">No unlocks match.</p>}
          </div>
          <Pager page={unlockData.page} pageSize={unlockData.pageSize} total={unlockData.total} noun="unlocks" onPage={(p) => set({ page: String(p) })} />
        </div>
      )}
      {!data && !error && <p className="muted">Loading…</p>}
    </>
  )
}
