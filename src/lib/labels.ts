import type { VendorStatus } from './types.ts'

export const KIND_LABEL = { cash: 'Cash', aso_ebi: 'Aso-ebi', wishlist: 'Wishlist' } as const

// Keep in step with be/src/lib/vendors.ts and fe/src/lib/vendors.ts.
export const CATEGORY_LABEL: Record<string, string> = {
  planner: 'Planner',
  venue: 'Venue',
  catering: 'Catering',
  photography: 'Photography',
  videography: 'Videography',
  decor: 'Decor & flowers',
  makeup: 'Makeup & gele',
  fashion: 'Fashion & tailoring',
  music: 'Music & DJs',
  mc: 'MC & host',
  cake: 'Cakes & desserts',
  rentals: 'Rentals',
  transport: 'Transport',
  gifts: 'Gift shop',
  other: 'Other',
}

export const VENDOR_STATUS_LABEL: Record<VendorStatus, string> = {
  pending: 'Waiting for review',
  approved: 'Live',
  rejected: 'Needs changes',
  draft: 'Draft',
  suspended: 'Suspended',
}
