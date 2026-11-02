import { useId, useState } from 'react'
import type { Point } from '../lib/types.ts'

type Props = {
  title: string
  points: Point[]
  /** How to show one value, such as a naira amount. */
  format: (value: number) => string
  /** The headline beside the title; defaults to the period's total. */
  total?: string
}

const W = 600
const H = 160
const GAP = 2

const dayLabel = (day: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Intl.DateTimeFormat('en-NG', opts).format(new Date(y!, m! - 1, d!))
}

/**
 * One series per day: thin bars with rounded tops on a quiet baseline, a tooltip per bar on hover
 * or keyboard focus, and the same numbers as a table for screen readers.
 */
export default function BarChart({ title, points, format, total }: Props) {
  const id = useId()
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...points.map((p) => p.value))
  const step = W / points.length
  const bar = Math.max(1, step - GAP)
  const sum = points.reduce((s, p) => s + p.value, 0)
  const tip = active !== null ? points[active] : null

  return (
    <figure className="card chart" aria-labelledby={`${id}-t`}>
      <div className="chart-head">
        <h2 id={`${id}-t`}>{title}</h2>
        <span className="chart-total">{total ?? format(sum)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <line className="chart-grid" x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} vectorEffect="non-scaling-stroke" />
        <line className="chart-grid" x1="0" x2={W} y1={H / 2} y2={H / 2} vectorEffect="non-scaling-stroke" strokeDasharray="2 4" />
        {points.map((p, i) => {
          const h = p.value ? Math.max(3, (p.value / max) * (H - 8)) : 0
          const x = i * step + GAP / 2
          const r = Math.min(4, bar / 2, h)
          return (
            <g key={p.day} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
              {h > 0 && (
                <path
                  className={`chart-bar${active !== null && active !== i ? ' chart-bar--dim' : ''}`}
                  // Rounded top corners only, so the bar sits flat on the baseline.
                  d={`M${x},${H} V${H - h + r} Q${x},${H - h} ${x + r},${H - h} H${x + bar - r} Q${x + bar},${H - h} ${x + bar},${H - h + r} V${H} Z`}
                />
              )}
              <rect className="chart-hit" x={i * step} y="0" width={step} height={H} />
            </g>
          )
        })}
      </svg>
      {tip && active !== null && (
        <div className="chart-tip" style={{ left: `${((active + 0.5) / points.length) * 100}%` }}>
          {format(tip.value)}
          <span>{dayLabel(tip.day, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
      )}
      <div className="chart-axis" aria-hidden="true">
        <span>{points[0] && dayLabel(points[0].day)}</span>
        <span>Peak {format(max === 1 && !points.some((p) => p.value) ? 0 : max)}</span>
        <span>Today</span>
      </div>
      <table className="visually-hidden">
        <caption>{title}, by day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <th scope="row">{dayLabel(p.day)}</th>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
