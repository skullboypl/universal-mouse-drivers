'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UMD } from '@/brand/umd'
import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { useLocale } from '@/i18n/LocaleContext'
import { LOCALE_LABELS, LOCALES, type Locale } from '@/i18n/locale'
import { useT } from '@/i18n/useT'
import type { MessageKey } from '@/i18n/messages'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import { Button } from './Button'
import styles from './TopNav.module.css'

const KING_TABS: { path: string; key: MessageKey; disabled?: boolean }[] = [
  { path: '/device/buttons', key: 'nav.buttons' },
  { path: '/device/sensor', key: 'nav.sensor' },
  { path: '/device/settings', key: 'nav.settings' },
]

/** OEM Fenrir / Superlight: one mouse page + settings. */
const OEM_TABS: { path: string; key: MessageKey }[] = [
  { path: '/device/buttons', key: 'nav.mouse' },
  { path: '/device/settings', key: 'nav.settings' },
]

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
  const { lp, locale, setLocale } = useLocale()
  const tr = useT()
  const pathname = usePathname() || ''
  const onMarketing = !connected && isMarketingPath(pathname)
  const oemSinglePage =
    driver?.identity.id === FENRIR_MAX_IDENTITY.id ||
    driver?.identity.id === SUPERLIGHT_IDENTITY.id
  const tabs = oemSinglePage ? OEM_TABS : KING_TABS
  const refreshing = deviceBusy && busyKind === 'refresh'

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
          <Link className={styles.homeLink} href={`${lp('/')}#mice`}>
            {tr('nav.mice')}
          </Link>
          <Link className={styles.homeLink} href={lp('/tray')}>
            {tr('nav.tray')}
          </Link>
          <Link className={styles.homeLink} href={lp('/why')}>
            {tr('nav.why')}
          </Link>
          <Link className={styles.homeLink} href={`${lp('/')}#faq`}>
            {tr('nav.faq')}
          </Link>
          <Link className={styles.homeLink} href={`${lp('/')}#contact`}>
            {tr('nav.contact')}
          </Link>
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
                : '—'}
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
          <Button variant="ghost" onClick={() => void disconnect()}>
            {tr('nav.disconnect')}
          </Button>
        )}
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
      </div>
    </header>
  )
}
