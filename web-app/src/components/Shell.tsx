import { Outlet } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { LOCALE_LABELS, LOCALES, type Locale } from '../i18n/locale'
import { useT } from '../i18n/useT'
import { useDeviceSession } from '../session/DeviceSessionContext'
import { TopNav } from './TopNav'
import { WriteToast } from './WriteToast'
import styles from './Shell.module.css'

export function Shell() {
  const { status, saveStatus } = useDeviceSession()
  const { locale, setLocale } = useLocale()
  const tr = useT()
  const saveHint =
    saveStatus === 'saving'
      ? tr('status.saving')
      : saveStatus === 'saved'
        ? tr('status.saved')
        : saveStatus === 'dirty'
          ? '…'
          : null

  return (
    <div className="app-shell">
      <TopNav />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <WriteToast />
      <footer className={`status-bar ${styles.footer}`}>
        <span className={styles.status}>
          {status ?? tr('status.ready')}
          {saveHint && !(status ?? '').includes(saveHint)
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
