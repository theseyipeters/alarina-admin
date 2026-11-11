import { useState } from 'react'
import { Link, useParams } from 'react-router'
import ActionDialog from '../components/ActionDialog.tsx'
import { PaymentPill, VendorPill } from '../components/Pill.tsx'
import { api, imageSrc } from '../lib/api.ts'
import { ACTION_LABEL } from '../lib/audit.ts'
import { formatCount, formatDateTime, formatNaira, plural, timeAgo } from '../lib/format.ts'
import { CATEGORY_LABEL } from '../lib/labels.ts'
import type { VendorDetail as Data } from '../lib/types.ts'
import { useApi } from '../lib/useApi.ts'
import { useTitle } from '../lib/useTitle.ts'

type Action = 'approve' | 'reject' | 'suspend' | 'restore'
type Tab = 'payments' | 'history'

/** A fact about the listing staff should weigh before approving: a dot and a word, never colour alone. */
function Check({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li>
      <span className={ok ? 'check-dot check-dot--ok' : 'check-dot'} aria-hidden="true" />
      {label}
      <span className="list-meta">{detail}</span>
    </li>
  )
}

const instagramUrl = (handle: string) => `https://instagram.com/${handle.replace(/^@/, '')}`

export default function VendorDetail() {
  const { id = '' } = useParams()
  const { data, error, reload } = useApi<Data>(`/vendors/${id}`)
  const [action, setAction] = useState<Action | null>(null)
  const [tab, setTab] = useState<Tab>('payments')
  const [notice, setNotice] = useState<string | null>(null)
  useTitle(data?.vendor.businessName ?? 'Vendor')

  if (error && !data) {
    return (
      <>
        <Link to="/vendors" className="back">← Vendors</Link>
        <div className="alert" role="alert"><p>{error}</p></div>
      </>
    )
  }
  if (!data) return <p className="muted">Loading…</p>

  const { vendor: v, owner, bookings, paid } = data
  const gifts = v.category === 'gifts'
  const photos = [v.coverImageId, ...v.gallery].filter((x): x is string => Boolean(x))
  const openBookings = bookings.enquiry + bookings.quoted

  async function run(kind: Action, text: string) {
    await api.post(`/vendors/${id}/${kind}`, kind === 'approve' ? { note: text || undefined } : { reason: text })
    setNotice(
      {
        approve: 'Approved. The listing is live in the marketplace, and the vendor has been emailed.',
        reject: 'Sent back with your note. The vendor has been emailed and can send it again once they’ve made changes.',
        suspend: 'Suspended. The listing is out of the marketplace and the vendor has been signed out.',
        restore: 'Restored to draft. The vendor can sign in again and send the listing for review.',
      }[kind],
    )
    reload()
  }

  return (
    <>
      <Link to="/vendors" className="back">← Vendors</Link>
      <div className="page-head">
        <div>
          <h1>{v.businessName}</h1>
          <p>
            {CATEGORY_LABEL[v.category] ?? v.category}
            {v.city && ` · ${v.city}`}
          </p>
        </div>
        <div className="pills">
          <VendorPill status={v.status} />
        </div>
      </div>

      {v.status === 'pending' && v.submittedAt && (
        <div className="alert alert--info" role="status">
          <p>Sent for review {timeAgo(v.submittedAt)}. Check the listing below, then approve it or say what to change.</p>
        </div>
      )}
      {(v.status === 'rejected' || v.status === 'suspended') && v.reviewNote && (
        <div className="alert" role="status">
          <p>
            {v.status === 'rejected' ? 'Sent back' : 'Suspended'}
            {v.reviewedBy && ` by ${v.reviewedBy}`} {timeAgo(v.reviewedAt)}: {v.reviewNote}
          </p>
        </div>
      )}
      {notice && (
        <div className="alert alert--success" role="status">
          <p>{notice}</p>
        </div>
      )}

      <dl className="kpis">
        <div className="kpi">
          <dt>Accepted bookings</dt>
          <dd className="kpi-value">{formatCount(bookings.accepted)}</dd>
          <dd className="kpi-sub">
            {formatCount(openBookings)} open · {formatCount(bookings.cancelled)} cancelled
          </dd>
        </div>
        <div className="kpi">
          <dt>Paid by couples</dt>
          <dd className="kpi-value">{formatNaira(paid.amount)}</dd>
          <dd className="kpi-sub">{plural(paid.count, 'payment')}</dd>
        </div>
        <div className="kpi">
          <dt>{gifts ? 'Products' : 'Packages'}</dt>
          <dd className="kpi-value">{formatCount(gifts ? v.products.length : v.packages.length)}</dd>
          <dd className="kpi-sub">{v.priceFrom ? `From ${formatNaira(v.priceFrom)}` : 'No starting price'}</dd>
        </div>
      </dl>

      <div className="grid grid--aside">
        <div className="stack">
          <section className="card" aria-labelledby="listing">
            <div className="section-head">
              <h2 id="listing">Listing</h2>
              {v.status === 'approved' && (
                <a href={v.marketplaceUrl} target="_blank" rel="noreferrer">
                  Open in marketplace
                </a>
              )}
            </div>
            {photos.length > 0 ? (
              <div className="photos">
                {photos.map((p, i) => (
                  <a key={p} href={imageSrc(p)} target="_blank" rel="noreferrer" className={i === 0 ? 'photo photo--cover' : 'photo'}>
                    <img src={imageSrc(p)} alt={i === 0 ? 'Cover photo' : `Photo ${i}`} loading="lazy" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="muted">No photos.</p>
            )}
            <p className="prose">{v.description || <span className="muted">No description.</span>}</p>
            <dl className="kv">
              <div>
                <dt>Phone</dt>
                <dd>{v.phone ? <a href={`tel:${v.phone}`}>{v.phone}</a> : '—'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{v.email ? <a href={`mailto:${v.email}`}>{v.email}</a> : '—'}</dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>
                  {v.website ? (
                    <a href={v.website} target="_blank" rel="noreferrer">
                      {v.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt>Instagram</dt>
                <dd>
                  {v.instagram ? (
                    <a href={instagramUrl(v.instagram)} target="_blank" rel="noreferrer">
                      @{v.instagram.replace(/^@/, '')}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt>Link</dt>
                <dd className="mono">{v.slug}</dd>
              </div>
            </dl>
          </section>

          <section className="card" aria-labelledby="offers">
            <h2 id="offers">{gifts ? 'Products' : 'Packages'}</h2>
            {gifts ? (
              v.products.length ? (
                <ul className="list">
                  {v.products.map((p) => (
                    <li key={p.id}>
                      {p.imageId ? <img className="thumb" src={imageSrc(p.imageId)} alt="" loading="lazy" /> : <span className="thumb" aria-hidden="true" />}
                      <span className="list-main list-grow">
                        {p.name}
                        {p.description && <span>{p.description}</span>}
                      </span>
                      <span className="list-meta">
                        {formatNaira(p.price)}
                        {!p.active && (
                          <>
                            <br />
                            Hidden
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">No products yet.</p>
              )
            ) : v.packages.length ? (
              <ul className="list">
                {v.packages.map((p) => (
                  <li key={p.id}>
                    <span className="list-main">
                      {p.name}
                      {p.description && <span>{p.description}</span>}
                    </span>
                    <span className="list-meta">{formatNaira(p.price)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">No packages{v.priceFrom ? `, only a starting price of ${formatNaira(v.priceFrom)}` : ''}.</p>
            )}
          </section>
        </div>

        <div className="stack">
          <section className="card" aria-labelledby="review">
            <h2 id="review">Review</h2>
            <ul className="list checks">
              <Check ok={Boolean(v.payout)} label="Payout account" detail={v.payout ? 'Set up' : 'Not yet: couples can’t pay in the app'} />
              <Check ok={Boolean(v.instagram || v.website)} label="Instagram or website" detail={v.instagram || v.website ? 'Given' : 'Neither'} />
              <Check ok={photos.length >= 3} label="Photos" detail={plural(photos.length, 'photo')} />
              <Check ok={Boolean(v.phone && v.email)} label="Phone and email" detail={v.phone && v.email ? 'Both' : v.phone ? 'Phone only' : 'Email only'} />
            </ul>
            <p className="hint section">
              Look for a real business: photos of their own work, prices that make sense, and a way to reach them that works.
            </p>
            <div className="action-list section">
              {v.status === 'pending' && (
                <>
                  <div className="action-item">
                    <p>Put the listing live in the marketplace. The vendor is emailed.</p>
                    <button className="btn btn--sm" onClick={() => setAction('approve')}>
                      Approve listing
                    </button>
                  </div>
                  <div className="action-item">
                    <p>Send it back with what to change. The vendor sees your note.</p>
                    <button className="btn btn--secondary btn--sm" onClick={() => setAction('reject')}>
                      Ask for changes
                    </button>
                  </div>
                </>
              )}
              <div className="action-item">
                {v.status === 'suspended' ? (
                  <>
                    <p>Let them sign in again. The listing goes back to draft, so it’s reviewed again before going live.</p>
                    <button className="btn btn--secondary btn--sm" onClick={() => setAction('restore')}>
                      Restore vendor
                    </button>
                  </>
                ) : (
                  <>
                    <p>Take the listing out of the marketplace and sign the vendor out. Bookings and payments stay on record.</p>
                    <button className="btn btn--danger btn--sm" onClick={() => setAction('suspend')}>
                      Suspend vendor
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="card" aria-labelledby="owner">
            <h2 id="owner">Owner</h2>
            {owner ? (
              <ul className="list">
                <li>
                  <span className="list-main">
                    {owner.name}
                    <span>
                      <a href={`mailto:${owner.email}`}>{owner.email}</a>
                    </span>
                  </span>
                  <span className="list-meta">Joined {timeAgo(owner.createdAt)}</span>
                </li>
              </ul>
            ) : (
              <p className="muted">The owner’s account no longer exists.</p>
            )}
            <dl className="kv section">
              <div>
                <dt>Payout account</dt>
                <dd>
                  {v.payout ? (
                    <>
                      {v.payout.accountName}
                      <br />
                      <span className="muted">
                        {v.payout.bankName} · ••••{v.payout.accountLast4}
                      </span>
                    </>
                  ) : (
                    'Not set up'
                  )}
                </dd>
              </div>
              <div>
                <dt>Listing created</dt>
                <dd>{formatDateTime(v.createdAt)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <div className="subnav" role="tablist" aria-label="Vendor records">
        {(
          [
            ['payments', `Payments (${formatCount(data.payments.length)})`],
            ['history', `Staff history (${formatCount(data.history.length)})`],
          ] as const
        ).map(([key, label]) => (
          <button key={key} role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'payments' &&
          (data.payments.length ? (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Couple</th>
                      <th scope="col">Reference</th>
                      <th scope="col" className="num">Vendor gets</th>
                      <th scope="col">Status</th>
                      <th scope="col">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => (
                      <tr key={p.id}>
                        <th scope="row">
                          {p.wedding ? <Link to={`/couples/${p.wedding.coupleId}`}>{p.wedding.names || 'Unnamed'}</Link> : <span className="muted">Deleted</span>}
                        </th>
                        <td data-label="Reference" className="mono">{p.reference}</td>
                        <td data-label="Vendor gets" className="num">{formatNaira(p.amount)}</td>
                        <td data-label="Status">
                          <PaymentPill status={p.status} />
                        </td>
                        <td data-label="When">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="hint">
                The latest {formatCount(data.payments.length)}. <Link to={`/payments?type=vendors&q=${encodeURIComponent(v.businessName)}`}>See all in Payments</Link>
              </p>
            </>
          ) : (
            <p className="empty">No payments from couples yet.</p>
          ))}
        {tab === 'history' &&
          (data.history.length ? (
            <ol className="timeline">
              {data.history.map((h) => (
                <li key={h.id}>
                  <span className="timeline-what">{ACTION_LABEL[h.action] ?? h.action}</span>
                  {h.reason && <q className="timeline-why">{h.reason}</q>}
                  <span className="timeline-meta">
                    {h.admin.name} · {formatDateTime(h.createdAt)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty">No staff have acted on this vendor.</p>
          ))}
      </div>

      <ActionDialog
        open={action === 'approve'}
        title="Approve this listing?"
        confirmLabel="Approve"
        busyLabel="Approving…"
        reasonOptional
        reasonLabel="Note to the vendor"
        reasonHint="Included in their email, and kept in the activity log."
        reasonPlaceholder="Lovely photos. Welcome to Alárinà."
        onConfirm={(t) => run('approve', t)}
        onClose={() => setAction(null)}
      >
        <p>
          {v.businessName} goes live in the marketplace, and couples can enquire and book.
          {!v.payout && ' They have no payout account yet, so couples can’t pay them in the app until they add one.'}
        </p>
      </ActionDialog>
      <ActionDialog
        open={action === 'reject'}
        title="Ask for changes?"
        confirmLabel="Send back"
        busyLabel="Sending…"
        reasonLabel="What to change"
        reasonHint="Sent to the vendor by email, and kept in the activity log."
        reasonPlaceholder="Add photos of your own work, and prices for each package."
        onConfirm={(t) => run('reject', t)}
        onClose={() => setAction(null)}
      >
        <p>The listing stays out of the marketplace. They can make changes and send it again.</p>
      </ActionDialog>
      <ActionDialog
        open={action === 'suspend'}
        title="Suspend this vendor?"
        confirmLabel="Suspend"
        busyLabel="Suspending…"
        danger
        reasonHint="Sent to the vendor by email, and kept in the activity log."
        reasonPlaceholder="Couples reported they took deposits and didn’t show up."
        onConfirm={(t) => run('suspend', t)}
        onClose={() => setAction(null)}
      >
        <p>The listing leaves the marketplace and the vendor is signed out. Couples keep their bookings and payment records.</p>
      </ActionDialog>
      <ActionDialog
        open={action === 'restore'}
        title="Restore this vendor?"
        confirmLabel="Restore"
        busyLabel="Restoring…"
        reasonPlaceholder="Resolved with the couples involved."
        onConfirm={(t) => run('restore', t)}
        onClose={() => setAction(null)}
      >
        <p>They can sign in again. The listing goes back to draft, so it needs another review before it’s live.</p>
      </ActionDialog>
    </>
  )
}
