import css from './SyncSpinner.module.css'
import type { MessageKey } from '../i18n/messages'
import { useT } from '../i18n/useT'

/** Full-viewport overlay while HID / OpenMouse connect runs, or after a connect error. */
export function SyncSpinner({
  label,
  labelKey = 'status.syncing',
  error = false,
  onCancel,
  cancelLabel,
}: {
  /** Live status from session (preferred over labelKey). */
  label?: string | null
  labelKey?: MessageKey
  /** Error mode — keep overlay until user dismisses. */
  error?: boolean
  onCancel?: () => void
  cancelLabel?: string
}) {
  const tr = useT()
  const text = (label && label.trim()) || tr(labelKey)
  return (
    <div
      className={`${css.overlay} ${error ? css.overlayError : ''}`}
      role={error ? 'alertdialog' : 'status'}
      aria-live="polite"
      aria-modal="true"
    >
      <div className={`${css.card} ${error ? css.cardError : ''}`}>
        <div className={css.row}>
          {!error ? <span className={css.spinner} aria-hidden /> : null}
          {error ? <span className={css.errorMark} aria-hidden>!</span> : null}
          <span className={css.label}>{text}</span>
        </div>
        {!error ? (
          <div className={css.track} aria-hidden>
            <div className={css.bar} />
          </div>
        ) : null}
        {onCancel ? (
          <button type="button" className={css.cancel} onClick={onCancel}>
            {cancelLabel ??
              tr(error ? 'status.dismissError' : 'status.cancelConnect')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
