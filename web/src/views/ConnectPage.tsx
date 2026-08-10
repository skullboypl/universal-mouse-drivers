'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UMD } from '@/brand/umd'
import { Button } from '@/components/Button'
import {
  DEVICE_CATALOG,
  findCatalogDevice,
} from '@/devices/registry'
import { FENRIR_MAX_IDENTITY } from '@/devices/gwolves-fenrir-max/identity'
import { KING_ULTRA_IDENTITY } from '@/devices/redragon-king-ultra/identity'
import type { DeviceIdentity, DeviceSupportStatus } from '@/devices/types'
import { useLocale } from '@/i18n/LocaleContext'
import { useT } from '@/i18n/useT'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import type { SavedDevice } from '@/session/savedDevices'
import type { HidPickTarget } from '@/transport/webhid'
import styles from './ConnectPage.module.css'

const HERO_SLIDE_MS = 4200

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

function DeviceThumb({
  src,
  alt,
}: {
  src?: string
  alt: string
}) {
  if (!src) return <span className={styles.thumbPlaceholder} aria-hidden />
  return (
    <img className={styles.thumb} src={src} alt={alt} width={56} height={56} />
  )
}

function connectingLabel(
  catalogId: string | undefined,
  syncing: string,
): string {
  if (catalogId === FENRIR_MAX_IDENTITY.id) return 'Fenrir…'
  if (catalogId === KING_ULTRA_IDENTITY.id) return 'King Ultra…'
  return syncing
}

function HeroMiceSlider({ devices }: { devices: DeviceIdentity[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const active = devices[index] ?? devices[0]

  useEffect(() => {
    if (devices.length < 2 || paused) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % devices.length)
    }, HERO_SLIDE_MS)
    return () => window.clearInterval(id)
  }, [devices.length, paused])

  if (!active) return null

  return (
    <div
      className={styles.heroVisual}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <div className={styles.glow} aria-hidden />
      <div className={styles.slideStage} aria-live="polite">
        {devices.map((d, i) => (
          <img
            key={d.id}
            className={`${styles.mouse} ${i === index ? styles.mouseActive : ''}`}
            src={d.imageUrl ?? '/brand/mouse-hero.png'}
            alt=""
            draggable={false}
          />
        ))}
      </div>
      <div className={styles.slideMeta}>
        <p className={styles.slideLabel}>
          <span className={styles.slideBrand}>{active.brand}</span>
          <span className={styles.slideModel}>{active.model}</span>
        </p>
        {devices.length > 1 ? (
          <div
            className={styles.slideDots}
            role="tablist"
            aria-label="Supported mice"
          >
            {devices.map((d, i) => (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${d.brand} ${d.model}`}
                className={i === index ? styles.dotActive : styles.dot}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ConnectPage() {
  const nav = useRouter()
  const { lp } = useLocale()
  const { connectMock, connectWebHid, webHidOk, savedDevices } =
    useDeviceSession()
  const tr = useT()
  const [connectingKey, setConnectingKey] = useState<string | null>(null)

  async function goHid(target?: HidPickTarget, key?: string) {
    setConnectingKey(key ?? target?.catalogId ?? 'any')
    try {
      const catalogId = await connectWebHid(target)
      nav.push(
        lp(
          catalogId === FENRIR_MAX_IDENTITY.id
            ? '/device/buttons'
            : '/device/sensor',
        ),
      )
    } catch {
      /* status bar already updated */
    } finally {
      setConnectingKey(null)
    }
  }

  async function goSaved(d: SavedDevice) {
    await goHid(
      {
        productId: d.productId,
        vendorId: d.vendorId,
        catalogId: d.catalogId,
      },
      `saved:${d.vendorId}:${d.productId}`,
    )
  }

  async function goCatalog(d: DeviceIdentity) {
    await goHid(
      {
        productId: d.productIds[0],
        vendorId: d.vendorId,
        catalogId: d.id,
      },
      `catalog:${d.id}`,
    )
  }

  async function goDemo() {
    setConnectingKey('demo')
    try {
      await connectMock()
      nav.push(lp('/device/sensor'))
    } finally {
      setConnectingKey(null)
    }
  }

  function statusText(status: DeviceSupportStatus) {
    if (status === 'live') return tr('connect.statusLive')
    if (status === 'wip') return tr('connect.statusWip')
    return tr('connect.statusPlanned')
  }

  const busyAny = connectingKey != null

  return (
    <div className={styles.page} data-brand="umd">
      <section className={styles.hero} aria-label={UMD.name}>
        <div className={styles.heroCopy}>
          <p className={styles.brandMark}>{UMD.shortName}</p>
          <h1 className={styles.headline}>{UMD.name}</h1>
          <p className={styles.lede}>{tr('connect.lede')}</p>
          <div className={styles.ctaRow}>
            <Button
              variant="primary"
              disabled={!webHidOk || busyAny}
              onClick={() => void goHid(undefined, 'any')}
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
            <Button disabled={busyAny} onClick={() => void goDemo()}>
              {tr('connect.demo')}
            </Button>
          </div>
          {!webHidOk && (
            <p className={styles.warn}>{tr('connect.noWebHid')}</p>
          )}
          <p className={styles.hint}>{tr('connect.hint')}</p>
        </div>
        <HeroMiceSlider devices={DEVICE_CATALOG} />
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h2>{tr('connect.savedTitle')}</h2>
          <p>{tr('connect.savedSub')}</p>
        </header>
        {savedDevices.length === 0 ? (
          <p className={styles.empty}>{tr('connect.savedEmpty')}</p>
        ) : (
          <ul className={styles.list}>
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
                    className={`${styles.listRow} ${
                      rowBusy ? styles.listRowBusy : ''
                    }`}
                    disabled={!webHidOk || busyAny}
                    onClick={() => void goSaved(d)}
                  >
                    <DeviceThumb
                      src={imageUrl}
                      alt={`${d.brand} ${d.model}`}
                    />
                    <span className={styles.listMain} style={{ flex: 1 }}>
                      <strong>
                        {d.brand} {d.model}
                      </strong>
                      <span className={styles.meta}>
                        {d.productName ??
                          `${d.vendorId.toString(16)}:${d.productId.toString(16)}`}
                      </span>
                    </span>
                    {rowBusy ? (
                      <span className={styles.rowBusy}>
                        <span className={styles.rowSpin} aria-hidden />
                        {connectingLabel(d.catalogId, tr('status.syncing'))}
                      </span>
                    ) : (
                      <span className={styles.meta}>
                        {new Date(d.lastSeen).toLocaleString()}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h2>{tr('connect.supportedTitle')}</h2>
          <p>{tr('connect.supportedSub')}</p>
        </header>
        <ul className={styles.list}>
          {DEVICE_CATALOG.map((d: DeviceIdentity) => {
            const canConnect = webHidOk && d.status !== 'planned'
            const key = `catalog:${d.id}`
            const rowBusy = connectingKey === key
            return (
              <li key={d.id} className={styles.supportRow}>
                <button
                  type="button"
                  className={`${styles.listRow} ${
                    rowBusy ? styles.listRowBusy : ''
                  }`}
                  disabled={!canConnect || busyAny}
                  onClick={() => {
                    if (!canConnect) return
                    void goCatalog(d)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    opacity: canConnect ? 1 : 0.72,
                    cursor: canConnect && !busyAny ? 'pointer' : 'default',
                  }}
                >
                  <DeviceThumb
                    src={d.imageUrl}
                    alt={`${d.brand} ${d.model}`}
                  />
                  <div className={styles.listMain} style={{ flex: 1 }}>
                    <strong>
                      {d.brand} {d.model}
                    </strong>
                    <span className={styles.meta}>{d.tagline}</span>
                  </div>
                  {rowBusy ? (
                    <span className={styles.rowBusy}>
                      <span className={styles.rowSpin} aria-hidden />
                      {connectingLabel(d.id, tr('status.syncing'))}
                    </span>
                  ) : (
                    <div className={styles.supportMeta}>
                      <span className={styles.ids}>{d.hidIds.join(' · ')}</span>
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
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={styles.contact}>
        <h2>{tr('connect.contactTitle')}</h2>
        <p>{tr('connect.contactBody')}</p>
        <p className={styles.barter}>
          {tr('connect.contactBarter')}{' '}
          <a
            className={styles.tiktok}
            href={UMD.tiktokUrl}
            target="_blank"
            rel="noreferrer"
          >
            tiktok.com/{UMD.tiktokHandle}
          </a>
          .
        </p>
        <div className={styles.contactLinks}>
          <a className={styles.mail} href={UMD.contactMailto}>
            {UMD.contactEmail}
          </a>
          <a
            className={styles.tiktok}
            href={UMD.tiktokUrl}
            target="_blank"
            rel="noreferrer"
          >
            {UMD.tiktokHandle}
          </a>
        </div>
      </section>
    </div>
  )
}
