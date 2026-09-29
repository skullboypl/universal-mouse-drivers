'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import {
  DEVICE_CATALOG,
  findCatalogDevice,
} from '@/devices/registry'
import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { PRO_X3_SUPERSTRIKE_IDENTITY } from '@/devices/mice/logitech/pro-x3-superstrike/identity'
import { BLITZ_ULTIMATE_IDENTITY } from '@/devices/mice/rampage/blitz-ultimate/identity'
import { KING_ULTRA_IDENTITY } from '@/devices/mice/redragon/king-ultra/identity'
import { useT } from '@/i18n/useT'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import { useConnectNavigation } from '@/session/useConnectNavigation'
import styles from './ConnectPage.module.css'

function resolveCatalogImage(
  catalogId: string,
  vendorId: number,
  productId: number,
): string | undefined {
  return (
    DEVICE_CATALOG.find((d) => d.id === catalogId)?.imageUrl ??
    findCatalogDevice(vendorId, productId)?.imageUrl
  )
}

function connectingLabel(catalogId: string | undefined, syncing: string): string {
  if (catalogId === FENRIR_MAX_IDENTITY.id) return 'Fenrir…'
  if (catalogId === KING_ULTRA_IDENTITY.id) return 'King Ultra…'
  if (catalogId === BLITZ_ULTIMATE_IDENTITY.id) return 'Blitz Ultimate…'
  if (catalogId === SUPERLIGHT_IDENTITY.id) return 'SUPERLIGHT…'
  if (catalogId === PRO_X3_SUPERSTRIKE_IDENTITY.id) return 'PRO X3 SUPERSTRIKE…'
  return syncing
}

export function RecentDevicesPage() {
  const { savedDevices } = useDeviceSession()
  const tr = useT()
  const { webHidOk, connectingKey, busyAny, goHid, goSaved } =
    useConnectNavigation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showSaved = mounted && savedDevices.length > 0

  return (
    <div className={styles.page} data-brand="umd">
      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h1>{tr('connect.savedTitle')}</h1>
          <p>{tr('connect.savedSub')}</p>
          <div className={styles.savedActions}>
            <Button
              variant="ghost"
              disabled={!webHidOk || busyAny}
              onClick={() => void goHid({ forcePicker: true }, 'other')}
            >
              {connectingKey === 'other' ? (
                <span className={styles.rowBusy}>
                  <span className={styles.rowSpin} aria-hidden />
                  {tr('status.syncing')}
                </span>
              ) : (
                tr('connect.otherDevice')
              )}
            </Button>
            <p className={styles.savedOtherTip}>{tr('connect.otherDeviceTip')}</p>
          </div>
        </header>

        {!mounted ? null : showSaved ? (
          <ul className={styles.savedList}>
            {savedDevices.map((d) => {
              const imageUrl = resolveCatalogImage(
                d.catalogId,
                d.vendorId,
                d.productId,
              )
              const key = `saved:${d.vendorId}:${d.productId}`
              const rowBusy = connectingKey === key
              return (
                <li key={key}>
                  <button
                    type="button"
                    className={`${styles.savedRow} ${
                      rowBusy ? styles.listRowBusy : ''
                    }`}
                    disabled={!webHidOk || busyAny}
                    onClick={() => void goSaved(d)}
                  >
                    {imageUrl ? (
                      <img
                        className={styles.savedThumb}
                        src={imageUrl}
                        alt=""
                        width={48}
                        height={48}
                      />
                    ) : (
                      <span className={styles.thumbPlaceholder} aria-hidden />
                    )}
                    <span className={styles.listMain}>
                      <strong>
                        {d.brand} {d.model}
                      </strong>
                      <span className={styles.metaMuted}>{tr('connect.open')}</span>
                    </span>
                    {rowBusy ? (
                      <span className={styles.rowBusy}>
                        <span className={styles.rowSpin} aria-hidden />
                        {connectingLabel(d.catalogId, tr('status.syncing'))}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className={styles.warn}>{tr('connect.savedEmpty')}</p>
        )}

        {mounted && !webHidOk ? (
          <p className={styles.warn}>{tr('connect.noWebHid')}</p>
        ) : null}
      </section>
    </div>
  )
}
