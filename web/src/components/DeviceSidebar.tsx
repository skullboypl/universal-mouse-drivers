'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UMD } from '@/brand/umd'
import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { PRO_X3_SUPERSTRIKE_IDENTITY } from '@/devices/mice/logitech/pro-x3-superstrike/identity'
import { OPENMOUSE_BACKED_ID } from '@/devices/openmouse/constants'
import { useLocale } from '@/i18n/LocaleContext'
import { useT } from '@/i18n/useT'
import type { MessageKey } from '@/i18n/messages'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import styles from './DeviceSidebar.module.css'

const KING_TABS: { path: string; key: MessageKey }[] = [
  { path: '/device/buttons', key: 'nav.buttons' },
  { path: '/device/sensor', key: 'nav.sensor' },
  { path: '/device/settings', key: 'nav.settings' },
]

// OpenMouse-Project's own app calls these tabs Performance and Advanced
// (control.openmouse.app: Overview / Performance / Buttons / Advanced) -
// matching the naming here, even though the content behind them is still
// ours. An Overview tab is the next phase; nothing here should promise one
// that doesn't exist yet.
const OPENMOUSE_TABS: { path: string; key: MessageKey }[] = [
  { path: '/device/sensor', key: 'nav.performance' },
  { path: '/device/settings', key: 'nav.advanced' },
]

const OEM_TABS: { path: string; key: MessageKey }[] = [
  { path: '/device/buttons', key: 'nav.mouse' },
  { path: '/device/settings', key: 'nav.settings' },
]

function icon(kind: 'mouse' | 'sensor' | 'settings') {
  if (kind === 'mouse') {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <rect
          x="7"
          y="2.5"
          width="10"
          height="19"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <line x1="12" y1="2.5" x2="12" y2="9" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  if (kind === 'sensor') {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <line x1="12" y1="1.5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.7" />
        <line x1="12" y1="19" x2="12" y2="22.5" stroke="currentColor" strokeWidth="1.7" />
        <line x1="1.5" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.7" />
        <line x1="19" y1="12" x2="22.5" y2="12" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18 6l-1.7 1.7M7.7 16.3 6 18M18 18l-1.7-1.7M7.7 7.7 6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function homeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9.5a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function iconFor(path: string) {
  if (path.endsWith('/sensor')) return icon('sensor')
  if (path.endsWith('/settings')) return icon('settings')
  return icon('mouse')
}

/**
 * Slim vertical icon rail for the device configurator (Wootility-style:
 * outer icon column instead of a horizontal tab bar). Only shown while a
 * device is connected; marketing pages keep TopNav's horizontal header.
 */
export function DeviceSidebar() {
  const { driver } = useDeviceSession()
  const { lp } = useLocale()
  const tr = useT()
  const pathname = usePathname() || ''

  const oemSinglePage =
    driver?.identity.id === FENRIR_MAX_IDENTITY.id ||
    driver?.identity.id === SUPERLIGHT_IDENTITY.id ||
    driver?.identity.id === PRO_X3_SUPERSTRIKE_IDENTITY.id
  const isOpenMouse = driver?.identity.id === OPENMOUSE_BACKED_ID
  const omTabs = [
    ...OPENMOUSE_TABS,
    ...(driver?.capabilities?.buttons
      ? [{ path: '/device/buttons', key: 'nav.buttons' as MessageKey }]
      : []),
  ]
  const tabs = oemSinglePage ? OEM_TABS : isOpenMouse ? omTabs : KING_TABS

  return (
    <aside className={styles.rail} aria-label={tr('nav.deviceNav')}>
      <Link href={lp('/')} className={styles.brandLink} aria-label={UMD.name}>
        <img src={UMD.logoMarkUrl} alt="" width={24} height={24} draggable={false} />
      </Link>
      <nav className={styles.tabs}>
        <Link href={lp('/')} className={styles.tab}>
          {homeIcon()}
          <span>{tr('nav.home')}</span>
        </Link>
        {tabs.map((tab) => {
          const href = lp(tab.path)
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={tab.path}
              href={href}
              className={active ? styles.tabActive : styles.tab}
            >
              {iconFor(tab.path)}
              <span>{tr(tab.key)}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
