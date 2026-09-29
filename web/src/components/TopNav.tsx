'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { OPENMOUSE_BACKED_ID } from '@/devices/openmouse/constants'
import {
  openMouseBrandLogoUrl,
  openMouseBrandSlugFromLabel,
} from '@/devices/openmouse/brandVisuals'
import { useLocale } from '@/i18n/LocaleContext'
import { useT } from '@/i18n/useT'
import type { MessageKey } from '@/i18n/messages'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import { Button } from './Button'
import { LanguageMenu } from './LanguageMenu'
import styles from './TopNav.module.css'

type ExtraLink = { href: string; key: MessageKey }

function isAppShellPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (p === '/' || /^\/[a-z]{2}$/.test(p)) return true
  if (/^\/[a-z]{2}\/(why|tray|recent)$/.test(p)) return true
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

/**
 * Top bar beside the always-visible left rail. Logo lives in the rail —
 * this header only shows the connected device (when any) plus actions.
 */
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
  const onAppShell = !connected && isAppShellPath(pathname)
  const isOpenMouse = driver?.identity.id === OPENMOUSE_BACKED_ID
  const refreshing = deviceBusy && busyKind === 'refresh'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

  // Secondary destinations not in the slim rail (tray / why).
  const extraLinks: ExtraLink[] = [
    { href: lp('/tray'), key: 'nav.tray' },
    { href: lp('/why'), key: 'nav.why' },
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
    <header className={styles.nav} data-om={isOpenMouse || undefined}>
      {connected && driver ? (
        isOpenMouse ? (
          <div
            className={`${styles.deviceBrand} ${styles.omBrand}`}
            aria-label={`OpenMouse · ${driver.identity.brand} ${driver.identity.model}`}
          >
            <img
              className={styles.omLogo}
              src={
                driver.identity.logoUrl ||
                openMouseBrandLogoUrl(
                  openMouseBrandSlugFromLabel(driver.identity.brand),
                )
              }
              alt=""
              width={32}
              height={32}
              draggable={false}
            />
            <span className={styles.brandText}>
              <span className={styles.omStack}>
                <span className={styles.omBadge}>OpenMouse</span>
                <span className={styles.omBrandName}>{driver.identity.brand}</span>
              </span>
              <span className={styles.brandSub}>{driver.identity.model}</span>
            </span>
          </div>
        ) : (
          <div className={styles.deviceLabel}>
            <span className={styles.deviceLabelName}>{driver.identity.model}</span>
            <span className={styles.deviceLabelBrand}>{driver.identity.brand}</span>
          </div>
        )
      ) : (
        <div className={styles.navSpacer} aria-hidden />
      )}

      {onAppShell ? (
        <nav className={styles.homeLinks} aria-label={tr('nav.siteNav')}>
          {extraLinks.map((link) => (
            <Link key={link.key} className={styles.homeLink} href={link.href}>
              {tr(link.key)}
            </Link>
          ))}
        </nav>
      ) : !connected ? (
        <div className={styles.navSpacer} />
      ) : null}

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
        {onAppShell && (
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

      {onAppShell && menuOpen ? (
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
            {extraLinks.map((link) => (
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
