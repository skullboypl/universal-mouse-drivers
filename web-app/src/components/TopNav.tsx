import { NavLink } from 'react-router-dom'
import { UMD } from '../brand/umd'
import { FENRIR_MAX_IDENTITY } from '../devices/gwolves-fenrir-max/identity'
import { useLocale } from '../i18n/LocaleContext'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/messages'
import { useDeviceSession } from '../session/DeviceSessionContext'
import { Button } from './Button'
import styles from './TopNav.module.css'

const KING_TABS: { path: string; key: MessageKey }[] = [
  { path: '/device/buttons', key: 'nav.buttons' },
  { path: '/device/sensor', key: 'nav.sensor' },
  { path: '/device/macro', key: 'nav.macro' },
  { path: '/device/settings', key: 'nav.settings' },
]

/** OEM Fenrir is one mouse page + settings — no separate sensor/macro tabs. */
const FENRIR_TABS: { path: string; key: MessageKey }[] = [
  { path: '/device/buttons', key: 'nav.mouse' },
  { path: '/device/settings', key: 'nav.settings' },
]

export function TopNav() {
  const { connected, state, disconnect, transportKind, saveStatus, driver } =
    useDeviceSession()
  const { lp } = useLocale()
  const tr = useT()
  const tabs =
    driver?.identity.id === FENRIR_MAX_IDENTITY.id ? FENRIR_TABS : KING_TABS

  return (
    <header className={styles.nav}>
      <NavLink to={lp('/')} className={styles.brand} aria-label={UMD.name}>
        <span className={styles.mark} aria-hidden>
          {UMD.shortName}
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandMain}>{UMD.shortName}</span>
          <span className={styles.brandSub}>{UMD.name}</span>
        </span>
      </NavLink>

      {connected ? (
        <nav className={styles.tabs}>
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={lp(tab.path)}
              className={({ isActive }) =>
                isActive ? styles.tabActive : styles.tab
              }
            >
              {tr(tab.key)}
            </NavLink>
          ))}
        </nav>
      ) : (
        <div />
      )}

      <div className={styles.meta}>
        {connected && (
          <span className={styles.pill}>
            {saveStatus === 'dirty' && '• '}
            {saveStatus === 'saving' && tr('status.saving')}
            {saveStatus === 'saved' && tr('status.saved')}
            {saveStatus === 'error' && tr('status.saveError')}
          </span>
        )}
        {connected && state && (
          <span
            className={[
              styles.pill,
              state.info.charging ? styles.charging : '',
            ].join(' ')}
          >
            {state.info.batteryPercent != null
              ? `${state.info.batteryPercent}%`
              : tr('status.battUnknown')}
            {state.info.charging ? ' ⚡' : ''}
            {transportKind ? ` · ${transportKind}` : ''}
          </span>
        )}
        {connected && (
          <Button variant="ghost" onClick={() => void disconnect()}>
            {tr('nav.disconnect')}
          </Button>
        )}
      </div>
    </header>
  )
}
