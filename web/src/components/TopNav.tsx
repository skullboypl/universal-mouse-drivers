'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UMD } from '@/brand/umd'
import { useLocale } from '@/i18n/LocaleContext'
import { useT } from '@/i18n/useT'
import type { MessageKey } from '@/i18n/messages'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import { Button } from './Button'
import styles from './TopNav.module.css'

const tabs: { path: string; key: MessageKey; disabled?: boolean }[] = [
  { path: '/device/buttons', key: 'nav.buttons' },
  { path: '/device/sensor', key: 'nav.sensor' },
  { path: '/device/macro', key: 'nav.macro', disabled: true },
  { path: '/device/settings', key: 'nav.settings' },
]

export function TopNav() {
  const { connected, state, disconnect, transportKind, saveStatus } =
    useDeviceSession()
  const { lp } = useLocale()
  const tr = useT()
  const pathname = usePathname() || ''

  return (
    <header className={styles.nav}>
      <Link href={lp('/')} className={styles.brand} aria-label={UMD.name}>
        <span className={styles.mark} aria-hidden>
          {UMD.shortName}
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandMain}>{UMD.shortName}</span>
          <span className={styles.brandSub}>{UMD.name}</span>
        </span>
      </Link>

      {connected ? (
        <nav className={styles.tabs}>
          {tabs.map((tab) => {
            const href = lp(tab.path)
            const active = pathname === href || pathname.startsWith(`${href}/`)
            if (tab.disabled) {
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
