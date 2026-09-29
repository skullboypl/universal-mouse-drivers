'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { DEVICE_CATALOG, OPENMOUSE_BACKED_ID } from '@/devices/registry'
import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { PRO_X3_SUPERSTRIKE_IDENTITY } from '@/devices/mice/logitech/pro-x3-superstrike/identity'
import { BLITZ_ULTIMATE_IDENTITY } from '@/devices/mice/rampage/blitz-ultimate/identity'
import { KING_ULTRA_IDENTITY } from '@/devices/mice/redragon/king-ultra/identity'
import type { DeviceIdentity, DeviceSupportStatus } from '@/devices/types'
import { useLocale } from '@/i18n/LocaleContext'
import { useT } from '@/i18n/useT'
import { useConnectNavigation } from '@/session/useConnectNavigation'
import styles from './ConnectPage.module.css'

function connectingLabel(catalogId: string | undefined, syncing: string): string {
  if (catalogId === FENRIR_MAX_IDENTITY.id) return 'Fenrir…'
  if (catalogId === KING_ULTRA_IDENTITY.id) return 'King Ultra…'
  if (catalogId === BLITZ_ULTIMATE_IDENTITY.id) return 'Blitz Ultimate…'
  if (catalogId === SUPERLIGHT_IDENTITY.id) return 'SUPERLIGHT…'
  if (catalogId === PRO_X3_SUPERSTRIKE_IDENTITY.id) return 'PRO X3 SUPERSTRIKE…'
  return syncing
}

export function NativeMicePage() {
  const { lp } = useLocale()
  const tr = useT()
  const { webHidOk, connectingKey, busyAny, goHid, goCatalog, goDemo } =
    useConnectNavigation()
  const [mounted, setMounted] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const nativeDevices = DEVICE_CATALOG.filter((d) => d.id !== OPENMOUSE_BACKED_ID)

  function statusText(status: DeviceSupportStatus) {
    if (status === 'live') return tr('connect.statusLive')
    if (status === 'wip') return tr('connect.statusWip')
    if (status === 'openmouse') return tr('connect.statusOpenMouse')
    return tr('connect.statusPlanned')
  }

  return (
    <div className={styles.page} data-brand="umd">
      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h1>{tr('connect.supportedTitle')}</h1>
          <p>{tr('connect.supportedSub')}</p>
          <div className={styles.savedActions}>
            <Button
              variant="primary"
              disabled={!webHidOk || busyAny}
              onClick={() => void goHid({ forcePicker: true }, 'any')}
            >
              {connectingKey === 'any' ? (
                <span className={styles.rowBusy}>
                  <span className={styles.rowSpin} aria-hidden />
                  {tr('status.syncing')}
                </span>
              ) : (
                tr('connect.webhid')
              )}
            </Button>
            <Button
              disabled={busyAny}
              variant="ghost"
              onClick={() => setDemoOpen((v) => !v)}
              aria-expanded={demoOpen}
            >
              {tr('connect.demo')}
            </Button>
          </div>
        </header>

        {demoOpen ? (
          <div className={styles.demoPanel} role="region" aria-label={tr('connect.demoTitle')}>
            <header className={styles.demoHead}>
              <div>
                <h2>{tr('connect.demoTitle')}</h2>
                <p>{tr('connect.demoSub')}</p>
              </div>
              <button
                type="button"
                className={styles.demoClose}
                onClick={() => setDemoOpen(false)}
              >
                {tr('connect.demoClose')}
              </button>
            </header>
            <p className={styles.demoLabel}>{tr('connect.demoNative')}</p>
            <ul className={styles.demoGrid}>
              {nativeDevices.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className={styles.demoCard}
                    disabled={busyAny}
                    onClick={() => void goDemo(d.id)}
                  >
                    {d.imageUrl ? (
                      <img src={d.imageUrl} alt="" width={72} height={72} />
                    ) : null}
                    <span className={styles.demoBrand}>{d.brand}</span>
                    <strong>{d.model}</strong>
                    <span className={`${styles.badge} ${styles.badgeLive}`}>
                      {tr('connect.badgeNative')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ul className={styles.deviceGrid}>
          {nativeDevices.map((d: DeviceIdentity) => {
            const hidReady = !mounted || webHidOk
            const planned = d.status === 'planned'
            const canConnect = hidReady && !planned
            const key = `catalog:${d.id}`
            const rowBusy = connectingKey === key
            return (
              <li key={d.id}>
                <button
                  type="button"
                  className={`${styles.deviceCard} ${
                    rowBusy ? styles.listRowBusy : ''
                  } ${!canConnect ? styles.deviceCardMuted : ''}`}
                  disabled={!canConnect || busyAny}
                  onClick={() => {
                    if (!canConnect) return
                    void goCatalog(d)
                  }}
                >
                  <div className={styles.deviceArt}>
                    {d.imageUrl ? (
                      <img
                        src={d.imageUrl}
                        alt=""
                        className={styles.deviceImg}
                        draggable={false}
                      />
                    ) : (
                      <span className={styles.thumbPlaceholder} aria-hidden />
                    )}
                  </div>
                  <div className={styles.deviceBody}>
                    <span className={styles.deviceBrand}>{d.brand}</span>
                    <strong className={styles.deviceModel}>{d.model}</strong>
                    <div className={styles.deviceFooter}>
                      <span
                        className={[
                          styles.badge,
                          d.status === 'live'
                            ? styles.badgeLive
                            : d.status === 'wip'
                              ? styles.badgeWip
                              : styles.badgePlanned,
                        ].join(' ')}
                      >
                        {statusText(d.status)}
                      </span>
                      {rowBusy ? (
                        <span className={styles.rowBusy}>
                          <span className={styles.rowSpin} aria-hidden />
                          {connectingLabel(d.id, tr('status.syncing'))}
                        </span>
                      ) : canConnect ? (
                        <span className={styles.openCue}>
                          {tr('connect.open')} →
                        </span>
                      ) : mounted && !webHidOk ? (
                        <span
                          className={`${styles.badge} ${styles.badgePcOnly}`}
                          title={tr('connect.pcOnlyTip')}
                        >
                          {tr('connect.pcOnly')}
                        </span>
                      ) : (
                        <span className={styles.openCueMuted}>
                          {tr('connect.soon')}
                        </span>
                      )}
                    </div>
                    <a
                      className={styles.deviceSeoLink}
                      href={lp(`/mice/${d.id}`)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tr('connect.learnMore')}
                    </a>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        {mounted && !webHidOk ? (
          <p className={styles.warn}>{tr('connect.noWebHid')}</p>
        ) : null}
      </section>
    </div>
  )
}
