import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Pager from '../components/Pager.tsx'
import { VendorPill } from '../components/Pill.tsx'
import Select from '../components/Select.tsx'
import { query } from '../lib/api.ts'
import { formatCount, formatShortDate, timeAgo } from '../lib/format.ts'
import { CATEGORY_LABEL, VENDOR_STATUS_LABEL } from '../lib/labels.ts'
import type { Paged, VendorRow, VendorStatus } from '../lib/types.ts'
import { useApi } from '../lib/useApi.ts'
import { useSearchState } from '../lib/useSearchState.ts'
import { useTitle } from '../lib/useTitle.ts'

// Waiting for review comes first: it's the job this page is for.
const STATUSES: (VendorStatus | 'all')[] = ['pending', 'approved', 'rejected', 'draft', 'suspended', 'all']

const CATEGORIES = [{ value: 'all', label: 'Every category' }, ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))]

const DEFAULTS = { q: '', status: 'pending', category: 'all', page: '1' }

type Data = Paged<VendorRow> & { counts: Record<VendorStatus, number> }

export default function Vendors() {
  useTitle('Vendors')
  const navigate = useNavigate()
  const [f, set] = useSearchState(DEFAULTS)
  const [search, setSearch] = useState(f.q)
  const qs = query({
    q: f.q,
    status: f.status === 'all' ? undefined : f.status,
    category: f.category === 'all' ? undefined : f.category,
    page: f.page === '1' ? undefined : f.page,
  })
  const { data, error, loading } = useApi<Data>(`/vendors${qs}`)
  const waiting = f.status === 'pending'

  useEffect(() => {
    const t = setTimeout(() => search !== f.q && set({ q: search }), 300)
    return () => clearTimeout(t)
  }, [search, f.q, set])

  const total = data ? Object.values(data.counts).reduce((s, n) => s + n, 0) : 0
  const label = (s: VendorStatus | 'all') => {
    const name = s === 'all' ? 'All' : VENDOR_STATUS_LABEL[s]
    const n = data && (s === 'all' ? total : data.counts[s])
    return n ? `${name} (${formatCount(n)})` : name
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Vendors</h1>
          <p>Every marketplace listing. Only approved listings are live for couples.</p>
        </div>
      </div>

      <div className="filters">
        <input
          className="search"
          type="search"
          aria-label="Search vendors"
          placeholder="Business name, email or city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="chips" role="group" aria-label="Status">
          {STATUSES.map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={f.status === s} onClick={() => set({ status: s })}>
              {label(s)}
            </button>
          ))}
        </div>
        <div className="filters-end select">
          <Select aria-label="Category" value={f.category} options={CATEGORIES} onChange={(category) => set({ category })} />
        </div>
      </div>

      {error && <div className="alert" role="alert"><p>{error}</p></div>}

      {data && (
        <div className="table-wrap" aria-busy={loading}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Vendor</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Payout account</th>
                <th scope="col">{waiting ? 'Waiting' : 'Joined'}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((v) => (
                <tr key={v.id} data-href onClick={(e) => !(e.target as HTMLElement).closest('a') && navigate(`/vendors/${v.id}`)}>
                  <th scope="row">
                    <span className="cell-main">
                      <Link to={`/vendors/${v.id}`}>{v.businessName}</Link>
                      {v.city && <span className="cell-sub">{v.city}</span>}
                    </span>
                  </th>
                  <td data-label="Category">{CATEGORY_LABEL[v.category] ?? v.category}</td>
                  <td data-label="Status">
                    <VendorPill status={v.status} />
                  </td>
                  <td data-label="Payout account">{v.payoutReady ? 'Set up' : <span className="muted">Not set up</span>}</td>
                  <td data-label={waiting ? 'Waiting' : 'Joined'}>
                    {waiting && v.submittedAt ? (
                      <span className="cell-main">
                        {timeAgo(v.submittedAt)}
                        <span className="cell-sub">Sent {formatShortDate(v.submittedAt)}</span>
                      </span>
                    ) : (
                      formatShortDate(v.createdAt)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.items.length &&
            (waiting && !f.q && f.category === 'all' ? (
              <p className="empty">
                Nothing waiting for review. <button type="button" className="link-button" onClick={() => set({ status: 'all' })}>See every vendor</button>
              </p>
            ) : (
              <p className="empty">No vendors match. Try another search or filter.</p>
            ))}
          <Pager page={data.page} pageSize={data.pageSize} total={data.total} noun="vendors" onPage={(p) => set({ page: String(p) })} />
        </div>
      )}
      {!data && !error && <p className="muted">Loading…</p>}
    </>
  )
}
