import type { CoupleStatus, PaymentStatus } from '../lib/types.ts'

const PAYMENT: Record<PaymentStatus, { label: string; tone: string }> = {
  success: { label: 'Paid', tone: 'pill--success' },
  pending: { label: 'Pending', tone: 'pill--strong' },
  failed: { label: 'Failed', tone: 'pill--danger' },
  abandoned: { label: 'Abandoned', tone: '' },
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const s = PAYMENT[status]
  return <span className={`pill ${s.tone}`}>{s.label}</span>
}

const COUPLE: Record<CoupleStatus, { label: string; tone: string }> = {
  published: { label: 'Published', tone: 'pill--success' },
  draft: { label: 'Draft', tone: '' },
  no_wedding: { label: 'Not started', tone: '' },
  suspended: { label: 'Suspended', tone: 'pill--danger' },
}

export function CouplePill({ status }: { status: CoupleStatus }) {
  const s = COUPLE[status]
  return <span className={`pill ${s.tone}`}>{s.label}</span>
}
