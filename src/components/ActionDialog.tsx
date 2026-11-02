import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { errorMessage } from '../lib/errors.ts'
import Field from './Field.tsx'

type Props = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  busyLabel: string
  danger?: boolean
  /** Ask staff to say why. The reason is kept in the activity log. */
  askReason?: boolean
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
}

/**
 * Confirms an action on a couple's account. Native <dialog>: focus is trapped while it's open,
 * starts on Cancel (the safe choice), and returns to the button that opened it.
 */
export default function ActionDialog({ open, title, children, confirmLabel, busyLabel, danger, askReason = true, onConfirm, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const opener = useRef<Element | null>(null)
  const titleId = useId()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      opener.current = document.activeElement
      setReason('')
      setError(null)
      dialog.showModal()
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
      if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus()
    }
  }, [open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (askReason && reason.trim().length < 3) {
      setError('Say why, in a few words. It’s kept in the activity log.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onConfirm(reason.trim())
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <h2 id={titleId}>{title}</h2>
        <div className="muted">{children}</div>
        {askReason && (
          <div className="section">
            <Field label="Reason" hint="Kept in the activity log, with your name." error={error}>
              {(p) => (
                <textarea {...p} rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Requested by the couple on WhatsApp" />
              )}
            </Field>
          </div>
        )}
        {!askReason && error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <div className="actions actions--end">
          <button ref={cancelRef} type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={danger ? 'btn btn--danger' : 'btn'} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
