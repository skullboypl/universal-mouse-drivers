'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UMD } from '@/brand/umd'
import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { PRO_X3_SUPERSTRIKE_IDENTITY } from '@/devices/mice/logitech/pro-x3-superstrike/identity'
import { OPENMOUSE_BACKED_ID } from '@/devices/openmouse/constants'
import { OPENMOUSE_HUB_PATH } from '@/devices/openmouse/catalog'
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

const OPENMOUSE_TABS: { path: string; key: MessageKey }[] = [
  { path: '/device/sensor', key: 'nav.performance' },
  { path: '/device/settings', key: 'nav.advanced' },
]

const OEM_TABS: { path: string; key: MessageKey }[] = [
  { path: '/device/buttons', key: 'nav.mouse' },
  { path: '/device/settings', key: 'nav.settings' },
]

type AppLink = { path: string; key: MessageKey; match: (p: string) => boolean }

const APP_LINKS: AppLink[] = [
  {
    path: '/',
    key: 'nav.home',
    match: (p) => p === '/' || p === '',
  },
  {
    path: '/recent',
    key: 'nav.recent',
    match: (p) => p === '/recent' || p.startsWith('/recent/'),
  },
  {
    path: '/mice',
    key: 'nav.native',
    match: (p) => {
      if (p === '/mice/openmouse' || p.startsWith('/mice/openmouse/')) return false
      return p === '/mice' || p.startsWith('/mice/')
    },
  },
  {
    path: OPENMOUSE_HUB_PATH,
    key: 'nav.openMouse',
    match: (p) => p === '/mice/openmouse' || p.startsWith('/mice/openmouse/'),
  },
]

function icon(kind: 'mouse' | 'sensor' | 'settings' | 'recent' | 'native' | 'om' | 'home') {
  if (kind === 'home') {
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
  if (kind === 'recent') {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8v4.5l3 1.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'native') {
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
  if (kind === 'om') {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path
          d="M4 7.5h16M4 12h16M4 16.5h10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
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
  if (kind === 'settings') {
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

function appIcon(path: string) {
  if (path === '/recent') return icon('recent')
  if (path === '/mice') return icon('native')
  if (path === OPENMOUSE_HUB_PATH) return icon('om')
  return icon('home')
}

function deviceIconFor(path: string) {
  if (path.endsWith('/sensor')) return icon('sensor')
  if (path.endsWith('/settings')) return icon('settings')
  return icon('mouse')
}

/**
 * Always-visible left rail: Home / Recent / Native / OpenMouse, plus
 * device tabs when a mouse is connected (Wootility-style).
 */
export function DeviceSidebar() {
  const { driver, connected } = useDeviceSession()
  const { lp } = useLocale()
  const tr = useT()
  const pathname = usePathname() || ''
  const pathNoLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'

  const onDeviceUi = pathNoLocale === '/device' || pathNoLocale.startsWith('/device/')
  const showDeviceTabs = connected && Boolean(driver) && onDeviceUi

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
  const deviceTabs = oemSinglePage ? OEM_TABS : isOpenMouse ? omTabs : KING_TABS

  return (
    <aside className={styles.rail} aria-label={tr('nav.siteNav')}>
      <Link href={lp('/')} className={styles.brandLink} aria-label={UMD.name}>
        <img src={UMD.logoMarkUrl} alt="" width={24} height={24} draggable={false} />
      </Link>
      <nav className={styles.tabs} aria-label={tr('nav.siteNav')}>
        {APP_LINKS.map((link) => {
          const href = lp(link.path)
          const active = link.match(pathNoLocale)
          return (
            <Link
              key={link.path}
              href={href}
              className={active ? styles.tabActive : styles.tab}
            >
              {appIcon(link.path)}
              <span>{tr(link.key)}</span>
            </Link>
          )
        })}
      </nav>
      {showDeviceTabs ? (
        <>
          <div className={styles.divider} aria-hidden />
          <nav className={styles.tabs} aria-label={tr('nav.deviceNav')}>
            {deviceTabs.map((tab) => {
              const href = lp(tab.path)
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={tab.path}
                  href={href}
                  className={active ? styles.tabActive : styles.tab}
                >
                  {deviceIconFor(tab.path)}
                  <span>{tr(tab.key)}</span>
                </Link>
              )
            })}
          </nav>
        </>
      ) : null}
    </aside>
  )
}
