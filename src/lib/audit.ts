import type { AuditEntry } from './types.ts'

export const ACTION_LABEL: Record<string, string> = {
  'admin.signin': 'Signed in',
  'admin.password_changed': 'Changed their password',
  'staff.created': 'Added staff',
  'staff.setup_link': 'Sent a setup link',
  'staff.disabled': 'Disabled staff',
  'staff.enabled': 'Re-enabled staff',
  'couple.suspended': 'Suspended',
  'couple.restored': 'Restored',
  'couple.signed_out': 'Signed out',
  'gifts.unlocked': 'Unlocked Gifts for',
  'gifts.locked': 'Locked Gifts for',
  'payment.rechecked': 'Re-checked payment',
}

/** "Suspended Ada & Tobi", "Re-checked payment alr_3f… (pending → success)". */
export function describe(e: AuditEntry) {
  const verb = ACTION_LABEL[e.action] ?? e.action
  const target = e.targetLabel ? ` ${e.targetLabel}` : ''
  const meta = e.meta ?? {}
  let extra = ''
  if (e.action === 'payment.rechecked' && meta.before && meta.after) {
    extra = meta.before === meta.after ? ` (still ${String(meta.after)})` : ` (${String(meta.before)} → ${String(meta.after)})`
  }
  if (typeof meta.sessionsEnded === 'number') extra = ` (${meta.sessionsEnded} session${meta.sessionsEnded === 1 ? '' : 's'} ended)`
  if (meta.via === 'setup_link') extra = ' from a setup link'
  return `${verb}${target}${extra}`
}
