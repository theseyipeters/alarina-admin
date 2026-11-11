import { VENDOR_STATUS_LABEL } from '../lib/labels.ts'
import type { CoupleStatus, PaymentStatus, VendorStatus } from '../lib/types.ts'

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

const VENDOR_TONE: Record<VendorStatus, string> = {
  pending: 'pill--strong',
  approved: 'pill--success',
  rejected: '',
  draft: '',
  suspended: 'pill--danger',
}

export function VendorPill({ status }: { status: VendorStatus }) {
  return <span className={`pill ${VENDOR_TONE[status]}`}>{VENDOR_STATUS_LABEL[status]}</span>
}
