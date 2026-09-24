import css from './SyncSpinner.module.css'
import type { MessageKey } from '../i18n/messages'
import { useT } from '../i18n/useT'

/** Center card + indeterminate bar while HID / OpenMouse connect or refresh runs. */
export function SyncSpinner({
  label,
  labelKey = 'status.syncing',
  onCancel,
  cancelLabel,
}: {
  /** Live status from session (preferred over labelKey). */
  label?: string | null
  labelKey?: MessageKey
  /** Shown during connect - aborts OpenMouse / HID probe. */
  onCancel?: () => void
  cancelLabel?: string
}) {
  const tr = useT()
  const text = (label && label.trim()) || tr(labelKey)
  return (
    <div className={css.overlay} role="status" aria-live="polite">
      <div className={css.card}>
        <div className={css.row}>
          <span className={css.spinner} aria-hidden />
          <span className={css.label}>{text}</span>
        </div>
        <div className={css.track} aria-hidden>
          <div className={css.bar} />
        </div>
        {onCancel ? (
          <button
            type="button"
            className={css.cancel}
            onClick={onCancel}
          >
            {cancelLabel ?? tr('status.cancelConnect')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
