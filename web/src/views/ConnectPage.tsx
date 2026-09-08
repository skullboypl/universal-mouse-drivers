'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UMD } from '@/brand/umd'
import { Button } from '@/components/Button'
import { FaqSection } from '@/components/FaqSection'
import ui from '@/components/ui.module.css'
import {
  DEVICE_CATALOG,
  findCatalogDevice,
  OPENMOUSE_BACKED_ID,
} from '@/devices/registry'
import {
  OPENMOUSE_HUB_PATH,
  getOpenMouseBrandCounts,
  getOpenMouseFeaturedEntries,
  openMouseBrandPath,
  openMouseDevicePath,
  openMouseLogoUrl,
} from '@/devices/openmouse/catalog'
import { OPENMOUSE_CATALOG } from '@/devices/openmouse/catalog.generated'
import type { OpenMouseDemoProfile } from '@/devices/openmouse/capabilities'
import { OpenMouseProductMark } from '@/components/OpenMouseProductMark'
import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { BLITZ_ULTIMATE_IDENTITY } from '@/devices/mice/rampage/blitz-ultimate/identity'
import { KING_ULTRA_IDENTITY } from '@/devices/mice/redragon/king-ultra/identity'
import type { DeviceIdentity, DeviceSupportStatus } from '@/devices/types'
import { useLocale } from '@/i18n/LocaleContext'
import { useT } from '@/i18n/useT'
import { faqForPage } from '@/lib/seoContent'
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

function connectingLabel(
  catalogId: string | undefined,
  syncing: string,
): string {
  if (catalogId === FENRIR_MAX_IDENTITY.id) return 'Fenrir…'
  if (catalogId === KING_ULTRA_IDENTITY.id) return 'King Ultra…'
  if (catalogId === BLITZ_ULTIMATE_IDENTITY.id) return 'Blitz Ultimate…'
  if (catalogId === SUPERLIGHT_IDENTITY.id) return 'SUPERLIGHT…'
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
  const { lp, locale } = useLocale()
  const { connectMock, connectWebHid, webHidOk, savedDevices } =
    useDeviceSession()
  const tr = useT()
  const [connectingKey, setConnectingKey] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function goHid(target?: HidPickTarget, key?: string) {
    setConnectingKey(key ?? target?.catalogId ?? 'any')
    try {
      const catalogId = await connectWebHid(target)
      nav.push(
        lp(
          catalogId === FENRIR_MAX_IDENTITY.id ||
            catalogId === SUPERLIGHT_IDENTITY.id
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

  async function goDemo(
    catalogId: string,
    opts?: { openMouseProfile?: OpenMouseDemoProfile },
  ) {
    setConnectingKey(
      `demo:${catalogId}${opts?.openMouseProfile ? `:${opts.openMouseProfile}` : ''}`,
    )
    setDemoOpen(false)
    try {
      await connectMock(catalogId, opts)
      nav.push(
        lp(
          catalogId === FENRIR_MAX_IDENTITY.id ||
            catalogId === SUPERLIGHT_IDENTITY.id
            ? '/device/buttons'
            : '/device/sensor',
        ),
      )
    } finally {
      setConnectingKey(null)
    }
  }

  function statusText(status: DeviceSupportStatus) {
    if (status === 'live') return tr('connect.statusLive')
    if (status === 'wip') return tr('connect.statusWip')
    if (status === 'openmouse') return tr('connect.statusOpenMouse')
    return tr('connect.statusPlanned')
  }

  const busyAny = connectingKey != null
  const showSaved = mounted && savedDevices.length > 0
  const nativeDevices = DEVICE_CATALOG.filter((d) => d.id !== OPENMOUSE_BACKED_ID)
  const omBrands = getOpenMouseBrandCounts().slice(0, 14)
  const omFeatured = getOpenMouseFeaturedEntries(8)

  return (
    <div className={styles.page} data-brand="umd">
      <section className={styles.hero} aria-label={UMD.name}>
        <div className={styles.heroCopy}>
          <p className={styles.brandMark}>
            {UMD.shortName} × OpenMouse
          </p>
          <h1 className={styles.headline}>{UMD.name}</h1>
          <p className={styles.lede}>{tr('connect.lede')}</p>
          <div className={styles.ctaRow}>
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
              variant="ghost"
              disabled={!webHidOk || busyAny}
              onClick={() =>
                void goHid(
                  { catalogId: OPENMOUSE_BACKED_ID, forcePicker: true },
                  `catalog:${OPENMOUSE_BACKED_ID}`,
                )
              }
            >
              {connectingKey === `catalog:${OPENMOUSE_BACKED_ID}` ? (
                <span className={styles.rowBusy}>
                  <span className={styles.rowSpin} aria-hidden />
                  {tr('status.syncing')}
                </span>
              ) : (
                tr('connect.webhidOm')
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
              <p className={styles.demoLabel}>{tr('connect.demoOpenMouse')}</p>
              <ul className={styles.demoGrid}>
                {(
                  [
                    ['full', 'connect.demoOmFull', 'connect.demoOmFullHint'],
                    ['sensor', 'connect.demoOmSensor', 'connect.demoOmSensorHint'],
                    ['dpi', 'connect.demoOmDpi', 'connect.demoOmDpiHint'],
                  ] as const
                ).map(([profile, titleKey, hintKey]) => (
                  <li key={profile}>
                    <button
                      type="button"
                      className={styles.demoCard}
                      disabled={busyAny}
                      onClick={() =>
                        void goDemo(OPENMOUSE_BACKED_ID, {
                          openMouseProfile: profile,
                        })
                      }
                    >
                      <img
                        src={openMouseLogoUrl(
                          profile === 'full'
                            ? 'razer'
                            : profile === 'sensor'
                              ? 'steelseries'
                              : 'glorious',
                        )}
                        alt=""
                        width={48}
                        height={48}
                      />
                      <span className={styles.demoBrand}>OpenMouse</span>
                      <strong>{tr(titleKey)}</strong>
                      <span className={styles.demoHint}>{tr(hintKey)}</span>
                      <span className={`${styles.badge} ${styles.badgeOm}`}>
                        {tr('connect.statusOpenMouse')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {mounted && !webHidOk ? (
            <p className={styles.warn}>{tr('connect.noWebHid')}</p>
          ) : null}
          <ol className={styles.steps}>
            <li>
              <span className={styles.stepNum}>1</span>
              {tr('connect.step1')}
            </li>
            <li>
              <span className={styles.stepNum}>2</span>
              {tr('connect.step2')}
            </li>
            <li>
              <span className={styles.stepNum}>3</span>
              {tr('connect.step3')}
            </li>
          </ol>
        </div>
        <HeroMiceSlider devices={nativeDevices} />
      </section>

      {showSaved ? (
        <section className={styles.section}>
          <header className={styles.sectionHead}>
            <h2>{tr('connect.savedTitle')}</h2>
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
                      <span className={styles.metaMuted}>
                        {tr('connect.open')}
                      </span>
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
        </section>
      ) : null}

      <section className={styles.section} id="mice">
        <header className={styles.sectionHead}>
          <h2>{tr('connect.supportedTitle')}</h2>
          <p>{tr('connect.supportedSub')}</p>
        </header>
        <ul className={styles.deviceGrid}>
          {nativeDevices.map((d: DeviceIdentity) => {
            const hidReady = webHidOk
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
                      ) : !hidReady ? (
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
      </section>

      <section className={styles.omSection} id="openmouse" aria-labelledby="om-home">
        <header className={styles.omHead}>
          <h2 id="om-home">{tr('connect.omTitle')}</h2>
          <p>{tr('connect.omSub')}</p>
          <div className={styles.omActions}>
            <Button
              variant="primary"
              disabled={!webHidOk || busyAny}
              onClick={() =>
                void goHid(
                  { catalogId: OPENMOUSE_BACKED_ID, forcePicker: true },
                  `catalog:${OPENMOUSE_BACKED_ID}`,
                )
              }
            >
              {connectingKey === `catalog:${OPENMOUSE_BACKED_ID}` ? (
                <span className={styles.rowBusy}>
                  <span className={styles.rowSpin} aria-hidden />
                  {tr('status.syncing')}
                </span>
              ) : (
                tr('connect.omConnect')
              )}
            </Button>
            <a className={ui.btnGhost} href={lp(OPENMOUSE_HUB_PATH)}>
              {tr('connect.omBrowseAll')} ({OPENMOUSE_CATALOG.length})
            </a>
          </div>
        </header>

        <p className={styles.omBrandsTitle}>{tr('connect.omBrands')}</p>
        <ul className={styles.omBrandChips}>
          {omBrands.map((b) => (
            <li key={b.brandSlug}>
              <a
                className={styles.omChip}
                href={lp(openMouseBrandPath(b.brandSlug))}
              >
                <img
                  src={openMouseLogoUrl(b.brandSlug)}
                  alt=""
                  width={22}
                  height={22}
                />
                <span>{b.brand}</span>
                <span className={styles.omChipCount}>{b.count}</span>
              </a>
            </li>
          ))}
        </ul>

        <p className={styles.omFeaturedTitle}>{tr('connect.omFeatured')}</p>
        <ul className={styles.omFeatured}>
          {omFeatured.map((e) => (
            <li key={e.id}>
              <a
                className={styles.omFeatureCard}
                href={lp(openMouseDevicePath(e.brandSlug, e.slug))}
                aria-label={`${e.brand} ${e.name}`}
              >
                <OpenMouseProductMark
                  brandSlug={e.brandSlug}
                  brand={e.brand}
                  model={e.name}
                  size="sm"
                  className={styles.omFeatureMark}
                />
                <p className={styles.omFeatureBrand}>{e.brand}</p>
                <span className={`${styles.badge} ${styles.badgeOm}`}>
                  {tr('connect.statusOpenMouse')}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.tray} id="tray">
        <div className={styles.trayPanel}>
          <div className={styles.trayIntro}>
            <p className={styles.trayEyebrow}>{tr('connect.trayEyebrow')}</p>
            <h2>{tr('connect.trayTitle')}</h2>
            <p className={styles.trayLead}>{tr('connect.trayBody')}</p>
            <p className={styles.trayLang}>{tr('connect.trayLang')}</p>
            <div className={styles.trayCta}>
              <a
                className={ui.btnPrimary}
                href="/api/downloads/UmdBatteryTray.exe"
                download="UmdBatteryTray.exe"
              >
                {tr('connect.trayDownload')}
              </a>
              <a className={styles.trayMore} href={lp('/tray')}>
                {tr('connect.trayMore')} →
              </a>
              <p className={styles.trayNote}>{tr('connect.trayNote')}</p>
            </div>
          </div>
          <ul className={styles.trayFeatures}>
            <li>{tr('connect.trayFeat1')}</li>
            <li>{tr('connect.trayFeat2')}</li>
            <li>{tr('connect.trayFeat3')}</li>
            <li>{tr('connect.trayFeat4')}</li>
            <li>{tr('connect.trayFeat5')}</li>
          </ul>
        </div>
      </section>

      <FaqSection title={tr('connect.faqTitle')} items={faqForPage(locale)} />

      <section className={styles.contact} id="contact">
        <div className={styles.contactPanel}>
          <div className={styles.contactIntro}>
            <p className={styles.contactEyebrow}>{tr('nav.contact')}</p>
            <h2>{tr('connect.contactTitle')}</h2>
            <p className={styles.contactLead}>{tr('connect.contactBody')}</p>
            <p className={styles.barter}>{tr('connect.contactBarter')}</p>
          </div>

          <div className={styles.contactChannels}>
            <a className={styles.contactCard} href={UMD.contactMailto}>
              <span className={styles.contactCardLabel}>
                {tr('connect.contactEmailLabel')}
              </span>
              <strong className={styles.contactCardValue}>
                {UMD.contactEmail}
              </strong>
              <span className={styles.contactCardCta}>
                {tr('connect.contactEmailCta')} →
              </span>
            </a>
            <a
              className={styles.contactCard}
              href={UMD.tiktokUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span className={styles.contactCardLabel}>
                {tr('connect.contactTiktokLabel')}
              </span>
              <strong className={styles.contactCardValue}>
                {UMD.tiktokHandle}
              </strong>
              <span className={styles.contactCardCta}>
                {tr('connect.contactTiktokCta')} →
              </span>
            </a>
          </div>

          <div className={styles.contactNeed}>
            <h3>{tr('connect.contactNeedTitle')}</h3>
            <ol>
              <li>{tr('connect.contactNeed1')}</li>
              <li>{tr('connect.contactNeed2')}</li>
              <li>{tr('connect.contactNeed3')}</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  )
}
