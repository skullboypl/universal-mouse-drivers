'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UMD } from '../brand/umd'
import { Button } from '../components/Button'
import {
  DEVICE_CATALOG,
  findCatalogDevice,
} from '../devices/registry'
import type { DeviceIdentity, DeviceSupportStatus } from '../devices/types'
import { useLocale } from '../i18n/LocaleContext'
import { useT } from '../i18n/useT'
import { useDeviceSession } from '../session/DeviceSessionContext'
import styles from './ConnectPage.module.css'

type HeroPos = { id: number; uiX: number; uiY: number }
const HERO_ART = { width: 1200, height: 1521 } as const

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

export function ConnectPage() {
  const nav = useRouter()
  const { lp } = useLocale()
  const { connectMock, connectWebHid, webHidOk, savedDevices } =
    useDeviceSession()
  const tr = useT()
  const [heroBadges, setHeroBadges] = useState<HeroPos[]>([])

  useEffect(() => {
    void fetch('/api/buttons?layoutId=king-ultra-hero')
      .then((r) => r.json())
      .then((data: { positions?: HeroPos[] }) => {
        if (Array.isArray(data.positions)) setHeroBadges(data.positions)
      })
      .catch(() => undefined)
  }, [])

  async function goHid(productId?: number) {
    try {
      await connectWebHid(productId)
      nav.push(lp('/device/sensor'))
    } catch {
      /* status bar already updated */
    }
  }

  async function goDemo() {
    await connectMock()
    nav.push(lp('/device/sensor'))
  }

  function statusText(status: DeviceSupportStatus) {
    if (status === 'live') return tr('connect.statusLive')
    if (status === 'wip') return tr('connect.statusWip')
    return tr('connect.statusPlanned')
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label={UMD.name}>
        <div className={styles.heroCopy}>
          <p className={styles.brandMark}>{UMD.shortName}</p>
          <h1 className={styles.headline}>{UMD.name}</h1>
          <p className={styles.lede}>{tr('connect.lede')}</p>
          <div className={styles.ctaRow}>
            <Button
              variant="primary"
              disabled={!webHidOk}
              onClick={() => void goHid()}
            >
              {tr('connect.webhid')}
            </Button>
            <Button onClick={() => void goDemo()}>{tr('connect.demo')}</Button>
          </div>
          {!webHidOk && (
            <p className={styles.warn}>{tr('connect.noWebHid')}</p>
          )}
          <p className={styles.hint}>{tr('connect.hint')}</p>
          <p className={styles.hint}>
            <a href="/api/downloads/UmdBatteryTray.exe">
              {tr('connect.trayDownload')}
            </a>
          </p>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.glow} aria-hidden />
          <div className={styles.heroArt}>
            <img
              className={styles.mouse}
              src="/brand/mouse-hero.png"
              alt=""
              draggable={false}
              width={HERO_ART.width}
              height={HERO_ART.height}
            />
            {heroBadges.map((b) => (
              <span
                key={b.id}
                className={styles.heroBadge}
                style={{
                  left: `${(b.uiX / HERO_ART.width) * 100}%`,
                  top: `${(b.uiY / HERO_ART.height) * 100}%`,
                }}
                aria-hidden
              >
                {b.id}
              </span>
            ))}
          </div>
        </div>
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
              return (
                <li key={`${d.vendorId}:${d.productId}`}>
                  <button
                    type="button"
                    className={styles.listRow}
                    disabled={!webHidOk}
                    onClick={() => void goHid(d.productId)}
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
                    <span className={styles.meta}>
                      {new Date(d.lastSeen).toLocaleString()}
                    </span>
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
          {DEVICE_CATALOG.map((d: DeviceIdentity) => (
            <li key={d.id} className={styles.supportRow}>
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
            </li>
          ))}
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
