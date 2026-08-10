'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from '@/i18n/LocaleContext'
import { LOCALE_LABELS, LOCALES, type Locale } from '@/i18n/locale'
import { useT } from '@/i18n/useT'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import { SyncSpinner } from './SyncSpinner'
import { TopNav } from './TopNav'
import { WriteToast } from './WriteToast'
import styles from './Shell.module.css'

export function Shell({ children }: { children: ReactNode }) {
  const {
    status,
    saveStatus,
    driver,
    deviceBusy,
    busyKind,
    connectingCatalogId,
  } = useDeviceSession()
  const { locale, setLocale } = useLocale()
  const pathname = usePathname()
  const tr = useT()
  const saveHint =
    saveStatus === 'saving'
      ? tr('status.saving')
      : saveStatus === 'saved'
        ? tr('status.saved')
        : saveStatus === 'dirty'
          ? '…'
          : null

  // Device OEM skins (e.g. Fenrir green) must not tint the UMD homepage.
  const onDeviceUi = /\/device(?:\/|$)/.test(pathname)
  const deviceSkin = onDeviceUi
    ? (driver?.identity.id ?? connectingCatalogId ?? 'none')
    : 'none'
  const busyLabelKey =
    busyKind === 'refresh' ? 'status.reading' : 'status.syncing'

  return (
    <div
      className={`app-shell ${deviceBusy ? styles.deviceBusy : ''}`}
      data-device={deviceSkin}
      aria-busy={deviceBusy || undefined}
    >
      <TopNav />
      <main className={`${styles.main} ${deviceBusy ? styles.busyMain : ''}`}>
        <div className={deviceBusy ? styles.blurContent : undefined}>
          {children}
        </div>
        {deviceBusy ? <SyncSpinner labelKey={busyLabelKey} /> : null}
      </main>
      <WriteToast />
      <footer className={`status-bar ${styles.footer}`}>
        <span className={styles.status}>
          {deviceBusy
            ? tr(busyLabelKey)
            : status ?? tr('status.ready')}
          {!deviceBusy &&
          saveHint &&
          !(status ?? '').includes(saveHint)
            ? ` · ${saveHint}`
            : ''}
        </span>
        <div
          className={styles.lang}
          role="group"
          aria-label={tr('footer.language')}
        >
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              className={
                code === locale ? styles.langActive : styles.langBtn
              }
              aria-pressed={code === locale}
              disabled={deviceBusy}
              onClick={() => setLocale(code as Locale)}
            >
              {LOCALE_LABELS[code]}
            </button>
          ))}
        </div>
      </footer>
    </div>
  )
}
