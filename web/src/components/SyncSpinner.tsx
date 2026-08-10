import css from './SyncSpinner.module.css'
import type { MessageKey } from '../i18n/messages'
import { useT } from '../i18n/useT'

/** Light blur-friendly center spinner for full HID sync / refresh read. */
export function SyncSpinner({
  labelKey = 'status.syncing',
}: {
  labelKey?: MessageKey
}) {
  const tr = useT()
  return (
    <div className={css.overlay} role="status" aria-live="polite">
      <div className={css.card}>
        <span className={css.spinner} aria-hidden />
        <span className={css.label}>{tr(labelKey)}</span>
      </div>
    </div>
  )
}
