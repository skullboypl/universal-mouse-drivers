'use client'

import { useEffect, useState } from 'react'
import {
  DEVICE_CATALOG,
  findCatalogDevice,
} from '@/devices/registry'
import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { PRO_X3_SUPERSTRIKE_IDENTITY } from '@/devices/mice/logitech/pro-x3-superstrike/identity'
import { BLITZ_ULTIMATE_IDENTITY } from '@/devices/mice/rampage/blitz-ultimate/identity'
import { KING_ULTRA_IDENTITY } from '@/devices/mice/redragon/king-ultra/identity'
import { OPENMOUSE_BACKED_ID } from '@/devices/openmouse/constants'
import {
  findOpenMouseCatalogEntry,
  openMouseBrandSlugFromLabel,
} from '@/devices/openmouse/catalog'
import { OpenMouseProductMark } from '@/components/OpenMouseProductMark'
import { useT } from '@/i18n/useT'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import { removeSavedDevice, type SavedDevice } from '@/session/savedDevices'
import { useConnectNavigation } from '@/session/useConnectNavigation'
import styles from './RecentDevicesPage.module.css'

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
  const { savedDevices, refreshSavedDevices } = useDeviceSession()
  const tr = useT()
  const { webHidOk, connectingKey, busyAny, goHid, goSaved } =
    useConnectNavigation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    refreshSavedDevices()
  }, [refreshSavedDevices])

  function onRemove(d: SavedDevice) {
    removeSavedDevice(d)
    refreshSavedDevices()
  }

  const list = mounted ? savedDevices : []

  return (
    <div className={styles.page} data-brand="umd">
      <header className={styles.head}>
        <h1>{tr('connect.savedTitle')}</h1>
        <p>{tr('connect.savedSub')}</p>
      </header>

      {!mounted ? null : (
        <ul className={styles.grid}>
          <li>
            <button
              type="button"
              className={styles.addCard}
              disabled={!webHidOk || busyAny}
              aria-label={tr('connect.addDevice')}
              title={tr('connect.otherDeviceTip')}
              onClick={() => void goHid({ forcePicker: true }, 'other')}
            >
              {connectingKey === 'other' ? (
                <span className={styles.addArt}>
                  <span className={styles.busy}>
                    <span className={styles.spin} aria-hidden />
                    {tr('status.syncing')}
                  </span>
                </span>
              ) : (
                <span className={styles.addArt}>
                  <span className={styles.addIcon} aria-hidden>
                    +
                  </span>
                </span>
              )}
              <span className={styles.addBody}>
                <span className={styles.addLabel}>{tr('connect.addDevice')}</span>
              </span>
            </button>
          </li>

          {list.map((d) => {
            const isOm = d.catalogId === OPENMOUSE_BACKED_ID
            const omEntry = isOm
              ? findOpenMouseCatalogEntry(d.vendorId, d.productId)
              : undefined
            const imageUrl = isOm
              ? undefined
              : resolveCatalogImage(d.catalogId, d.vendorId, d.productId)
            const key = `saved:${d.catalogId}:${d.vendorId}:${d.productId}`
            const rowBusy = connectingKey === `saved:${d.vendorId}:${d.productId}`
            return (
              <li key={key} className={styles.cardWrap}>
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={tr('connect.removeSaved')}
                  disabled={busyAny}
                  onClick={() => onRemove(d)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M6 6l12 12M18 6 6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`${styles.card} ${rowBusy ? styles.cardBusy : ''}`}
                  disabled={!webHidOk || busyAny}
                  onClick={() => void goSaved(d)}
                >
                  <div className={styles.art}>
                    {isOm ? (
                      <OpenMouseProductMark
                        brandSlug={omEntry?.brandSlug ?? openMouseBrandSlugFromLabel(d.brand)}
                        brand={omEntry?.brand ?? d.brand}
                        model={omEntry?.name ?? d.model}
                        size="sm"
                      />
                    ) : imageUrl ? (
                      <img src={imageUrl} alt="" draggable={false} />
                    ) : (
                      <span className={styles.artPlaceholder} aria-hidden />
                    )}
                  </div>
                  <div className={styles.body}>
                    <span className={styles.brand}>{omEntry?.brand ?? d.brand}</span>
                    <strong className={styles.model}>{omEntry?.name ?? d.model}</strong>
                    {rowBusy ? (
                      <span className={styles.busy}>
                        <span className={styles.spin} aria-hidden />
                        {connectingLabel(d.catalogId, tr('status.syncing'))}
                      </span>
                    ) : (
                      <span className={styles.cue}>{tr('connect.open')} →</span>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {mounted && list.length === 0 ? (
        <p className={styles.empty}>{tr('connect.savedEmpty')}</p>
      ) : null}

      {mounted && !webHidOk ? (
        <p className={styles.warn}>{tr('connect.noWebHid')}</p>
      ) : null}
    </div>
  )
}
