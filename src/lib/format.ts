// Amounts from the API are in kobo. Dates are shown in Lagos time, where Alárinà's couples are.

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })
const nairaWhole = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
const nairaCompact = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 })
const count = new Intl.NumberFormat('en-NG')

/** 1025381 → "₦10,253.81"; whole amounts drop the kobo ("₦10,000"). */
export const formatNaira = (kobo: number) => (kobo % 100 === 0 ? nairaWhole : naira).format(kobo / 100)

/** For headline tiles: "₦1.6M". */
export const formatNairaShort = (kobo: number) => (kobo < 1_000_000_00 ? formatNaira(kobo) : nairaCompact.format(kobo / 100))

export const formatCount = (n: number) => count.format(n)

const dateTime = new Intl.DateTimeFormat('en-NG', {
  timeZone: 'Africa/Lagos',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})
const shortDate = new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' })

/** An instant from the API, in Lagos time: "2 Nov 2026, 9:38 am". */
export const formatDateTime = (iso: string | null) =>
  iso ? dateTime.format(new Date(iso)).replace(/\b(AM|PM)\b/, (m) => m.toLowerCase()) : ''

export const formatShortDate = (iso: string | null) => (iso ? shortDate.format(new Date(iso)) : '')

/** A calendar date (YYYY-MM-DD) as written, never shifted by time zones: "Sat, 20 Feb 2027". */
export function formatDay(value: string | null, weekday = true) {
  if (!value) return ''
  const [y, m, d] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-NG', { ...(weekday && { weekday: 'short' }), day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(y!, m! - 1, d!),
  )
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "3 minutes ago", "yesterday", or the date once it's over a week. */
export function timeAgo(iso: string | null) {
  if (!iso) return ''
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (abs < 7 * 86_400) return rtf.format(Math.round(seconds / 86_400), 'day')
  return formatShortDate(iso)
}

export const todayInLagos = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date())

/** Whole days from today (in Lagos) to a YYYY-MM-DD date; negative once it has passed. */
export function daysUntil(date: string) {
  const toUtc = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return Date.UTC(y!, m! - 1, day!)
  }
  return Math.round((toUtc(date) - toUtc(todayInLagos())) / 86_400_000)
}

export const plural = (n: number, one: string, many = `${one}s`) => `${formatCount(n)} ${n === 1 ? one : many}`
