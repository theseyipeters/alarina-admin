import { Link } from 'react-router'
import Pager from '../components/Pager.tsx'
import Select from '../components/Select.tsx'
import { query } from '../lib/api.ts'
import { ACTION_LABEL, describe } from '../lib/audit.ts'
import { formatDateTime } from '../lib/format.ts'
import type { AuditEntry, Paged } from '../lib/types.ts'
import { useApi } from '../lib/useApi.ts'
import { useSearchState } from '../lib/useSearchState.ts'
import { useTitle } from '../lib/useTitle.ts'

const DEFAULTS = { action: 'all', signins: 'false', page: '1' }

/** Everything staff have done, newest first. Entries are never edited or deleted. */
export default function Activity() {
  useTitle('Activity')
  const [f, set] = useSearchState(DEFAULTS)
  const qs = query({
    action: f.action,
    signins: f.signins === 'true' ? true : undefined,
    page: f.page === '1' ? undefined : f.page,
  })
  const { data, error, loading } = useApi<Paged<AuditEntry> & { actions: string[] }>(`/audit${qs}`)
  const options = [{ value: 'all', label: 'Every action' }, ...(data?.actions ?? []).map((a) => ({ value: a, label: ACTION_LABEL[a] ?? a }))]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Activity</h1>
          <p>What the team has done, and why. Kept for good, and never edited.</p>
        </div>
      </div>

      <div className="filters">
        <div className="select">
          <Select aria-label="Action" value={f.action} options={options} onChange={(action) => set({ action })} />
        </div>
        {f.action === 'all' && (
          <button type="button" className="chip" aria-pressed={f.signins === 'true'} onClick={() => set({ signins: f.signins === 'true' ? 'false' : 'true' })}>
            Include sign-ins
          </button>
        )}
      </div>

      {error && <div className="alert" role="alert"><p>{error}</p></div>}
      {data && (
        <div aria-busy={loading}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">What</th>
                  <th scope="col">Why</th>
                  <th scope="col">Who</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e.id}>
                    <th scope="row">{e.coupleId ? <Link to={`/couples/${e.coupleId}`}>{describe(e)}</Link> : describe(e)}</th>
                    <td data-label="Why">{e.reason ?? <span className="muted">—</span>}</td>
                    <td data-label="Who">
                      <span className="cell-main">
                        {e.admin.name}
                        <span className="cell-sub">{e.admin.email}</span>
                      </span>
                    </td>
                    <td data-label="When">{formatDateTime(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.items.length && <p className="empty">Nothing here yet.</p>}
          </div>
          <Pager page={data.page} pageSize={data.pageSize} total={data.total} noun="entries" onPage={(p) => set({ page: String(p) })} />
        </div>
      )}
      {!data && !error && <p className="muted">Loading…</p>}
    </>
  )
}
