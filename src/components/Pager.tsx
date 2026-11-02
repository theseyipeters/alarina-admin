import { formatCount } from '../lib/format.ts'

type Props = { page: number; pageSize: number; total: number; onPage: (page: number) => void; noun: string }

export default function Pager({ page, pageSize, total, onPage, noun }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total ? (page - 1) * pageSize + 1 : 0
  const to = Math.min(total, page * pageSize)
  return (
    <nav className="pager" aria-label="Pages">
      <span>
        {total ? `${formatCount(from)}–${formatCount(to)} of ${formatCount(total)} ${total === 1 ? noun.replace(/s$/, '') : noun}` : `No ${noun}`}
      </span>
      {pages > 1 && (
        <span className="actions">
          <button className="btn btn--secondary btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Previous
          </button>
          <button className="btn btn--secondary btn--sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Next
          </button>
        </span>
      )}
    </nav>
  )
}
