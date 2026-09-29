'use client'

import { useLocaleOptional } from '../i18n/LocaleContext'
import { readStoredLocale } from '../i18n/locale'
import { useT } from '../i18n/useT'
import { getOpenMouseCapabilityCopy } from '../devices/openmouse/capabilityPresentation'
import styles from './DriverStackDialog.module.css'

function MouseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <rect
        x="6.5"
        y="2"
        width="11"
        height="20"
        rx="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <line x1="12" y1="2" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function CommunityIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <circle cx="7" cy="8" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="8" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="17" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <line x1="8.8" y1="9.6" x2="10.6" y2="15" stroke="currentColor" strokeWidth="1.7" />
      <line x1="15.2" y1="9.6" x2="13.4" y2="15" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export type DriverStackChoice = 'native' | 'openmouse'

export type OpenMouseControlSummary = {
  key: string
  label: string
  state: 'driver' | 'runtime' | 'unknown'
}

export type DriverStackPrompt = {
  nativeBrand: string
  nativeModel: string
  productHint?: string
  /** What OpenMouse actually offers for this exact device - not a generic
   * "community" hint, but its real matched controls (see
   * capabilityPresentation.ts). Undefined when no catalog entry matched. */
  openMouseControls?: OpenMouseControlSummary[]
}

type Props = {
  prompt: DriverStackPrompt
  onChoose: (choice: DriverStackChoice) => void
  onCancel: () => void
}

export function DriverStackDialog({ prompt, onChoose, onCancel }: Props) {
  const tr = useT()
  // Rendered by DeviceSessionProvider outside LocaleProvider (see
  // src/app/[lang]/layout.tsx), so this mirrors useT's own locale fallback
  // instead of useLocale(), which throws here.
  const localeCtx = useLocaleOptional()
  const locale = localeCtx?.locale ?? readStoredLocale() ?? 'pl'
  const omCopy = getOpenMouseCapabilityCopy(locale)
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
            <span className={styles.choiceIcon}>
              <MouseIcon />
            </span>
            <span className={styles.choiceText}>
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
            </span>
          </button>
          <button
            type="button"
            className={styles.choice}
            onClick={() => onChoose('openmouse')}
          >
            <span className={styles.choiceIcon}>
              <CommunityIcon />
            </span>
            <span className={styles.choiceText}>
              <span className={styles.choiceLabel}>
                {tr('connect.stackOpenMouse')}
              </span>
              <span className={styles.choiceHint}>
                {tr('connect.stackOpenMouseHint')}
              </span>
              {prompt.openMouseControls && prompt.openMouseControls.length > 0 ? (
                <span className={styles.controlPills}>
                  {prompt.openMouseControls.map((c) => (
                    <span
                      key={c.key}
                      className={styles.controlPill}
                      data-state={c.state}
                      title={c.state === 'driver' ? omCopy.verified : omCopy.runtime}
                    >
                      {c.label}
                    </span>
                  ))}
                </span>
              ) : (
                // No catalog entry for this exact VID:PID (Logitech is
                // matched by usage page at connect time, not statically) -
                // say plainly this is a brand-only guess, not a confirmed
                // capability list.
                <span className={styles.choiceWarning}>
                  {tr('connect.stackOpenMouseUnverified')}
                </span>
              )}
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
