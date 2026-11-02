// Shapes of the admin API's responses (be/src/routes/admin). Amounts are in kobo.

export type Admin = { id: string; name: string; email: string }

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number }

export type GiftKind = 'cash' | 'aso_ebi' | 'wishlist'
export type KindTotals = Record<GiftKind, { amount: number; count: number }>
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned'

export type Point = { day: string; value: number }

export type Overview = {
  totals: {
    couples: number
    users: number
    suspended: number
    weddings: { draft: number; published: number }
    rsvps: { attending: number; declined: number }
    gifts: { amount: number; fees: number; count: number; weddings: number; byKind: KindTotals }
    unlocks: { paid: number; revenue: number; comped: number }
    pendingPayments: number
  }
  trends: { days: number; signups: Point[]; published: Point[]; rsvps: Point[]; gifts: Point[]; unlockRevenue: Point[] }
  upcoming: {
    coupleId: string
    names: string
    date: string
    venueName: string | null
    slug: string | null
    attending: number
    replies: number
  }[]
  recent: {
    id: string
    createdAt: string
    names: string
    status: CoupleStatus
    members: { name: string; email: string }[]
  }[]
  system: {
    db: boolean
    paystack: { configured: boolean; mode: 'test' | 'live' | null; feesConfirmed: boolean }
    email: boolean
    environment: string
  }
}

export type CoupleStatus = 'draft' | 'published' | 'no_wedding' | 'suspended'

export type CoupleRow = {
  id: string
  createdAt: string
  suspended: boolean
  members: { name: string; email: string }[]
  wedding: {
    names: string
    date: string | null
    slug: string | null
    status: 'draft' | 'published'
    venueName: string | null
    giftsUnlocked: boolean
  } | null
  replies: { attending: number; total: number }
  gifts: { amount: number; count: number }
}

export type AuditEntry = {
  id: string
  action: string
  admin: { id: string; name: string; email: string }
  coupleId: string | null
  targetType: 'couple' | 'payment' | 'unlock' | 'staff' | null
  targetId: string | null
  targetLabel: string | null
  reason: string | null
  meta: Record<string, unknown> | null
  createdAt: string
}

export type UnlockRow = {
  id: string
  reference: string
  wedding?: { coupleId: string; names: string; slug: string | null } | null
  charge: number
  status: PaymentStatus
  comp: boolean
  grantedBy: string | null
  note: string | null
  createdAt: string
  paidAt: string | null
}

export type CoupleDetail = {
  couple: {
    id: string
    createdAt: string
    suspendedAt: string | null
    suspendedReason: string | null
    members: { id: string; name: string; email: string; createdAt: string; activeSessions: number; lastSignInAt: string | null }[]
    pendingInvite: { email: string | null; expiresAt: string } | null
  }
  wedding: {
    id: string
    names: string
    partnerOneName: string | null
    partnerTwoName: string | null
    date: string | null
    startTime: string | null
    venueName: string | null
    venueAddress: string | null
    status: 'draft' | 'published'
    slug: string | null
    inviteUrl: string | null
    publishedAt: string | null
    setupCompletedAt: string | null
    checkpoint: number
    events: number
    template: string
    palette: string
    giftsUnlockedAt: string | null
    giftsClosed: boolean
    switches: { cash: boolean; asoEbi: boolean; wishlist: boolean }
    items: { asoEbi: number; wishlist: number }
    payout: { bankName: string; accountName: string; accountLast4: string; verifiedAt: string } | null
    createdAt: string
    updatedAt: string
  } | null
  stats: { replies: { attending: number; declined: number }; gifts: KindTotals }
  rsvps: { id: string; name: string; email: string; phone: string; attending: boolean; side: string | null; createdAt: string }[]
  payments: {
    id: string
    reference: string
    guestName: string
    guestEmail: string
    guestPhone: string | null
    kinds: GiftKind[]
    amount: number
    fee: number
    charge: number
    status: PaymentStatus
    createdAt: string
    paidAt: string | null
  }[]
  unlocks: UnlockRow[]
  history: AuditEntry[]
}

export type GiftPayment = {
  id: string
  reference: string
  wedding: { coupleId: string; names: string; slug: string | null } | null
  guestName: string
  guestEmail: string
  guestPhone: string | null
  lines: { kind: GiftKind; amount: number; itemName: string | null; quantity: number | null; unit: string | null }[]
  amount: number
  fee: number
  charge: number
  status: PaymentStatus
  createdAt: string
  paidAt: string | null
}

export type Staff = {
  id: string
  name: string
  email: string
  createdAt: string
  lastSignInAt: string | null
  disabledAt: string | null
  pendingSetup: boolean
  setupExpiresAt: string | null
  isYou: boolean
}

export type SetupLink = { link: string; expiresAt: string; emailSent: boolean }
