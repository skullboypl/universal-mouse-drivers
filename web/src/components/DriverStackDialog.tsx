'use client'

import { useT } from '../i18n/useT'
import styles from './DriverStackDialog.module.css'

export type DriverStackChoice = 'native' | 'openmouse'

export type DriverStackPrompt = {
  nativeBrand: string
  nativeModel: string
  productHint?: string
}

type Props = {
  prompt: DriverStackPrompt
  onChoose: (choice: DriverStackChoice) => void
  onCancel: () => void
}

export function DriverStackDialog({ prompt, onChoose, onCancel }: Props) {
  const tr = useT()
  const deviceLine =
    prompt.productHint?.trim() ||
    `${prompt.nativeBrand} ${prompt.nativeModel}`.trim()

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="driver-stack-title"
      onClick={onCancel}
    >
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="driver-stack-title" className={styles.title}>
          {tr('connect.stackTitle')}
        </h2>
        <p className={styles.body}>{tr('connect.stackBody')}</p>
        {deviceLine ? <p className={styles.device}>{deviceLine}</p> : null}
        <div className={styles.choices}>
          <button
            type="button"
            className={`${styles.choice} ${styles.choicePrimary}`}
            onClick={() => onChoose('native')}
          >
            <span className={styles.choiceLabel}>
              {tr('connect.stackNative')}
              <span className={styles.badge}>
                {tr('connect.stackRecommended')}
              </span>
            </span>
            <span className={styles.choiceHint}>
              {tr('connect.stackNativeHint').replace(
                '{device}',
                `${prompt.nativeBrand} ${prompt.nativeModel}`.trim(),
              )}
            </span>
          </button>
          <button
            type="button"
            className={styles.choice}
            onClick={() => onChoose('openmouse')}
          >
            <span className={styles.choiceLabel}>
              {tr('connect.stackOpenMouse')}
            </span>
            <span className={styles.choiceHint}>
              {tr('connect.stackOpenMouseHint')}
            </span>
          </button>
        </div>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          {tr('connect.stackCancel')}
        </button>
      </div>
    </div>
  )
}
