import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Pager from '../components/Pager.tsx'
import { CouplePill } from '../components/Pill.tsx'
import Select from '../components/Select.tsx'
import { API_BASE, query } from '../lib/api.ts'
import { formatCount, formatDay, formatNaira, formatShortDate } from '../lib/format.ts'
import type { CoupleRow, Paged } from '../lib/types.ts'
import { useApi } from '../lib/useApi.ts'
import { useSearchState } from '../lib/useSearchState.ts'
import { useTitle } from '../lib/useTitle.ts'

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'no_wedding', label: 'Not started' },
  { value: 'unlocked', label: 'Gifts unlocked' },
  { value: 'suspended', label: 'Suspended' },
]

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'wedding_date', label: 'Wedding soonest' },
]

const DEFAULTS = { q: '', status: 'all', sort: 'newest', page: '1' }

const statusOf = (c: CoupleRow) => (c.suspended ? 'suspended' : (c.wedding?.status ?? 'no_wedding'))

export default function Couples() {
  useTitle('Couples')
  const navigate = useNavigate()
  const [f, set] = useSearchState(DEFAULTS)
  const [search, setSearch] = useState(f.q)
  const qs = query({ q: f.q, status: f.status, sort: f.sort, page: f.page === '1' ? undefined : f.page })
  const { data, error, loading } = useApi<Paged<CoupleRow>>(`/couples${qs}`)

  // Search as you type, after a short pause.
  useEffect(() => {
    const t = setTimeout(() => search !== f.q && set({ q: search }), 300)
    return () => clearTimeout(t)
  }, [search, f.q, set])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Couples</h1>
          <p>Every wedding space: who’s in it, how far they’ve got, and what came in.</p>
        </div>
        <a className="btn btn--secondary" href={`${API_BASE}/couples/export.csv${query({ q: f.q, status: f.status, sort: f.sort })}`}>
          Export CSV
        </a>
      </div>

      <div className="filters">
        <input
          className="search"
          type="search"
          aria-label="Search couples"
          placeholder="Search names, emails or link"
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
        <div className="filters-end select">
          <Select aria-label="Sort" value={f.sort} options={SORTS} onChange={(sort) => set({ sort })} />
        </div>
      </div>

      {error && <div className="alert" role="alert"><p>{error}</p></div>}

      {data && (
        <div className="table-wrap" aria-busy={loading}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Couple</th>
                <th scope="col">Wedding</th>
                <th scope="col">Status</th>
                <th scope="col" className="num">Replies</th>
                <th scope="col" className="num">Gifts</th>
                <th scope="col">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                // The whole row opens the couple; the name stays a real link for keyboards and new tabs.
                <tr key={c.id} data-href onClick={(e) => !(e.target as HTMLElement).closest('a') && navigate(`/couples/${c.id}`)}>
                  <th scope="row">
                    <span className="cell-main">
                      <Link to={`/couples/${c.id}`}>{c.wedding?.names || c.members.map((m) => m.name).join(' & ')}</Link>
                      <span className="cell-sub">{c.members.map((m) => m.email).join(' · ')}</span>
                    </span>
                  </th>
                  <td data-label="Wedding">
                    <span className="cell-main">
                      {c.wedding?.date ? formatDay(c.wedding.date) : <span className="muted">No date</span>}
                      {c.wedding?.venueName && <span className="cell-sub">{c.wedding.venueName}</span>}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span className="pills">
                      <CouplePill status={statusOf(c)} />
                      {c.wedding?.giftsUnlocked && <span className="pill">Gifts</span>}
                    </span>
                  </td>
                  <td data-label="Replies" className="num">
                    {formatCount(c.replies.total)}
                    {c.replies.total > 0 && <span className="cell-sub"> · {formatCount(c.replies.attending)} yes</span>}
                  </td>
                  <td data-label="Gifts" className="num">
                    {c.gifts.amount ? formatNaira(c.gifts.amount) : <span className="muted">—</span>}
                  </td>
                  <td data-label="Joined">{formatShortDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.items.length && <p className="empty">No couples match. Try another search or filter.</p>}
          <Pager page={data.page} pageSize={data.pageSize} total={data.total} noun="couples" onPage={(p) => set({ page: String(p) })} />
        </div>
      )}
      {!data && !error && <p className="muted">Loading…</p>}
    </>
  )
}
