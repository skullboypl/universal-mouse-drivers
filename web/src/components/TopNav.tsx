'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { UMD } from '@/brand/umd'
import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { OPENMOUSE_BACKED_ID } from '@/devices/openmouse/constants'
import { useLocale } from '@/i18n/LocaleContext'
import { useT } from '@/i18n/useT'
import type { MessageKey } from '@/i18n/messages'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import { Button } from './Button'
import { LanguageMenu } from './LanguageMenu'
import styles from './TopNav.module.css'

const KING_TABS: { path: string; key: MessageKey; disabled?: boolean }[] = [
  { path: '/device/buttons', key: 'nav.buttons' },
  { path: '/device/sensor', key: 'nav.sensor' },
  { path: '/device/settings', key: 'nav.settings' },
]

/** OpenMouse: sensor-first; buttons/settings only when capabilities allow. */
const OPENMOUSE_TABS: { path: string; key: MessageKey }[] = [
  { path: '/device/sensor', key: 'nav.sensor' },
  { path: '/device/settings', key: 'nav.settings' },
]

/** OEM Fenrir / Superlight: one mouse page + settings. */
const OEM_TABS: { path: string; key: MessageKey }[] = [
  { path: '/device/buttons', key: 'nav.mouse' },
  { path: '/device/settings', key: 'nav.settings' },
]

type MarketingLink = { href: string; key: MessageKey }

function isMarketingPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (p === '/' || /^\/[a-z]{2}$/.test(p)) return true
  if (/^\/[a-z]{2}\/why$/.test(p)) return true
  if (/^\/[a-z]{2}\/tray$/.test(p)) return true
  if (/^\/[a-z]{2}\/mice(\/|$)/.test(p)) return true
  return false
}

function batteryFillWidth(percent: number | null): number {
  if (percent == null) return 0
  return Math.max(0, Math.min(100, percent))
}

function batteryTone(percent: number | null): string {
  if (percent == null) return styles.batteryUnknown
  if (percent <= 15) return styles.batteryLow
  if (percent <= 35) return styles.batteryMid
  return styles.batteryOk
}

export function TopNav() {
  const {
    connected,
    state,
    disconnect,
    transportKind,
    saveStatus,
    driver,
    refreshFromDevice,
    deviceBusy,
    busyKind,
  } = useDeviceSession()
  const { lp } = useLocale()
  const tr = useT()
  const pathname = usePathname() || ''
  const onMarketing = !connected && isMarketingPath(pathname)
  const oemSinglePage =
    driver?.identity.id === FENRIR_MAX_IDENTITY.id ||
    driver?.identity.id === SUPERLIGHT_IDENTITY.id
  const isOpenMouse = driver?.identity.id === OPENMOUSE_BACKED_ID
  const omTabs = [
    ...OPENMOUSE_TABS,
    ...(driver?.capabilities?.buttons
      ? [{ path: '/device/buttons', key: 'nav.buttons' as MessageKey }]
      : []),
  ]
  const tabs = oemSinglePage ? OEM_TABS : isOpenMouse ? omTabs : KING_TABS
  const refreshing = deviceBusy && busyKind === 'refresh'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

  const marketingLinks: MarketingLink[] = [
    { href: `${lp('/')}#mice`, key: 'nav.mice' },
    { href: `${lp('/')}#openmouse`, key: 'nav.openMouse' },
    { href: lp('/tray'), key: 'nav.tray' },
    { href: lp('/why'), key: 'nav.why' },
    { href: `${lp('/')}#faq`, key: 'nav.faq' },
    { href: `${lp('/')}#contact`, key: 'nav.contact' },
  ]

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onResize = () => {
      if (window.matchMedia('(min-width: 981px)').matches) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  return (
    <header className={styles.nav}>
      <Link href={lp('/')} className={styles.brand} aria-label={UMD.name}>
        <img
          className={styles.logo}
          src={UMD.logoMarkUrl}
          alt=""
          width={36}
          height={36}
          draggable={false}
        />
        <span className={styles.brandText}>
          <span className={styles.brandMain}>{UMD.shortName}</span>
          <span className={styles.brandSub}>{UMD.name}</span>
        </span>
      </Link>

      {connected ? (
        <nav className={styles.tabs} aria-label={tr('nav.deviceNav')}>
          {tabs.map((tab) => {
            const href = lp(tab.path)
            const active = pathname === href || pathname.startsWith(`${href}/`)
            if ('disabled' in tab && tab.disabled) {
              return (
                <span
                  key={tab.path}
                  className={styles.tabDisabled}
                  title={tr('nav.macroSoon')}
                  aria-disabled="true"
                >
                  {tr(tab.key)}
                  <span className={styles.soon}>{tr('nav.soon')}</span>
                </span>
              )
            }
            return (
              <Link
                key={tab.path}
                href={href}
                className={active ? styles.tabActive : styles.tab}
              >
                {tr(tab.key)}
              </Link>
            )
          })}
        </nav>
      ) : onMarketing ? (
        <nav className={styles.homeLinks} aria-label={tr('nav.siteNav')}>
          {marketingLinks.map((link) => (
            <Link
              key={link.key}
              className={styles.homeLink}
              href={link.href}
            >
              {tr(link.key)}
            </Link>
          ))}
        </nav>
      ) : (
        <div className={styles.navSpacer} />
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
        {connected && (
          <button
            type="button"
            className={styles.refreshBtn}
            disabled={deviceBusy}
            aria-busy={refreshing}
            title={tr('nav.refreshData')}
            onClick={() => void refreshFromDevice()}
          >
            <svg
              className={[
                styles.refreshIcon,
                refreshing ? styles.refreshSpin : '',
              ]
                .filter(Boolean)
                .join(' ')}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 12a9 9 0 1 1-2.6-6.3" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
            <span className={styles.refreshLabel}>{tr('nav.refreshData')}</span>
          </button>
        )}
        {connected && state && (
          <span
            className={[
              styles.battery,
              state.info.charging ? styles.batteryCharging : '',
              batteryTone(state.info.batteryPercent),
            ]
              .filter(Boolean)
              .join(' ')}
            title={
              state.info.batteryPercent != null
                ? `${state.info.batteryPercent}%${state.info.charging ? ' · charging' : ''}${transportKind ? ` · ${transportKind}` : ''}`
                : tr('status.battUnknown')
            }
          >
            <span className={styles.batteryIcon} aria-hidden>
              <span
                className={styles.batteryFill}
                style={{
                  width: `${batteryFillWidth(state.info.batteryPercent)}%`,
                }}
              />
            </span>
            <span className={styles.batteryPct}>
              {state.info.batteryPercent != null
                ? `${state.info.batteryPercent}%`
                : '-'}
            </span>
            {state.info.charging ? (
              <span className={styles.batteryBolt} aria-hidden>
                ⚡
              </span>
            ) : null}
          </span>
        )}
        {connected && transportKind ? (
          <span className={styles.pillMuted}>{transportKind}</span>
        ) : null}
        {connected && (
          <Button
            variant="ghost"
            className={styles.disconnectBtn}
            onClick={() => void disconnect()}
          >
            {tr('nav.disconnect')}
          </Button>
        )}
        <LanguageMenu />
        {onMarketing && (
          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? tr('nav.closeMenu') : tr('nav.openMenu')}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={styles.menuBars} data-open={menuOpen || undefined}>
              <span />
              <span />
              <span />
            </span>
          </button>
        )}
      </div>

      {onMarketing && menuOpen ? (
        <>
          <button
            type="button"
            className={styles.menuBackdrop}
            aria-label={tr('nav.closeMenu')}
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id={menuId}
            className={styles.mobileMenu}
            aria-label={tr('nav.siteNav')}
          >
            {marketingLinks.map((link) => (
              <Link
                key={link.key}
                className={styles.mobileLink}
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {tr(link.key)}
              </Link>
            ))}
          </nav>
        </>
      ) : null}
    </header>
  )
}
