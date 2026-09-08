'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { UMD } from '@/brand/umd'
import { useLocale } from '@/i18n/LocaleContext'
import { useT } from '@/i18n/useT'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import { SyncSpinner } from './SyncSpinner'
import { TopNav } from './TopNav'
import { WriteToast } from './WriteToast'
import styles from './Shell.module.css'

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const {
    status,
    saveStatus,
    driver,
    deviceBusy,
    busyKind,
    connectingCatalogId,
  } = useDeviceSession()
  const pathname = usePathname()
  const { lp } = useLocale()
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
  const onDeviceUi = /\/device(?:\/|$)/.test(pathname ?? '')
  const deviceSkin = onDeviceUi
    ? (driver?.identity.id ?? connectingCatalogId ?? 'none')
    : 'none'
  const busyLabelKey =
    busyKind === 'refresh' ? 'status.reading' : 'status.syncing'

  const statusText = deviceBusy
    ? tr(busyLabelKey)
    : status ?? tr('status.ready')
  const statusWithSave =
    !deviceBusy && saveHint && !statusText.includes(saveHint)
      ? `${statusText} · ${saveHint}`
      : statusText

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
      <footer className={styles.siteFooter}>
        <div className={styles.footerInner}>
          <div className={styles.footerStatus} aria-live="polite">
            {statusWithSave}
          </div>

          <div className={styles.footerBrand}>
            <p className={styles.copyright}>
              Copyright © {UMD.copyrightYear} - {UMD.copyrightName}
            </p>
            <p className={styles.madeWith}>
              {tr('footer.madeWith')}{' '}
              <span className={styles.heart} aria-hidden>
                ♥
              </span>{' '}
              <a
                className={styles.githubLink}
                href={UMD.githubFeedbackUrl}
                target="_blank"
                rel="noreferrer"
              >
                <GitHubIcon className={styles.githubIcon} />
                {UMD.githubHandle}
              </a>
            </p>
          </div>

          <nav className={styles.footerLinks} aria-label={tr('footer.links')}>
            <a href={`${lp('/')}#mice`}>{tr('nav.mice')}</a>
            <a href={lp('/tray')}>{tr('nav.tray')}</a>
            <a href={lp('/why')}>{tr('nav.why')}</a>
            <a href={`${lp('/')}#faq`}>{tr('nav.faq')}</a>
            <a href={`${lp('/')}#contact`}>{tr('nav.contact')}</a>
            <a href={UMD.sourceUrl} target="_blank" rel="noreferrer">
              {tr('footer.source')}
            </a>
            <a href={UMD.openMouseUrl} target="_blank" rel="noreferrer">
              {tr('footer.openMouse')}
            </a>
            <a href={UMD.githubFeedbackUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={UMD.tiktokUrl} target="_blank" rel="noreferrer">
              TikTok
            </a>
            <a href={UMD.contactMailto}>{tr('connect.contactEmailLabel')}</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
