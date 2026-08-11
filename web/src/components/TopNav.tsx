'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UMD } from '@/brand/umd'
import { FENRIR_MAX_IDENTITY } from '@/devices/gwolves-fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/logitech-pro-x-superlight/identity'
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
  { path: '/device/macro', key: 'nav.macro', disabled: true },
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

export function TopNav() {
  const { connected, state, disconnect, transportKind, saveStatus, driver } =
    useDeviceSession()
  const { lp, locale, setLocale } = useLocale()
  const tr = useT()
  const pathname = usePathname() || ''
  const onMarketing = !connected && isMarketingPath(pathname)
  const oemSinglePage =
    driver?.identity.id === FENRIR_MAX_IDENTITY.id ||
    driver?.identity.id === SUPERLIGHT_IDENTITY.id
  const tabs = oemSinglePage ? OEM_TABS : KING_TABS

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
