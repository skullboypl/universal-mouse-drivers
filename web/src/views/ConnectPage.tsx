'use client'

import { useEffect, useState } from 'react'
import { UMD } from '@/brand/umd'
import { Button } from '@/components/Button'
import { FaqSection } from '@/components/FaqSection'
import { MeasureLine } from '@/components/MeasureLine'
import ui from '@/components/ui.module.css'
import { DEVICE_CATALOG, OPENMOUSE_BACKED_ID } from '@/devices/registry'
import {
  OPENMOUSE_HUB_PATH,
  getOpenMouseBrandCounts,
} from '@/devices/openmouse/catalog'
import { OPENMOUSE_CATALOG } from '@/devices/openmouse/catalog.generated'
import type { DeviceIdentity } from '@/devices/types'
import { useLocale } from '@/i18n/LocaleContext'
import { useT } from '@/i18n/useT'
import { faqForPage } from '@/lib/seoContent'
import { useConnectNavigation } from '@/session/useConnectNavigation'
import styles from './ConnectPage.module.css'

const HERO_SLIDE_MS = 4200

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

/** Marketing / SEO landing. Device pickers live under Recent / Native / OpenMouse. */
export function ConnectPage() {
  const { lp, locale } = useLocale()
  const tr = useT()
  const { webHidOk, connectingKey, busyAny, goHid } = useConnectNavigation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const nativeDevices = DEVICE_CATALOG.filter((d) => d.id !== OPENMOUSE_BACKED_ID)
  const omBrandCount = getOpenMouseBrandCounts().length

  return (
    <div className={styles.page} data-brand="umd" id="top">
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
            <a className={ui.btnGhost} href={lp('/mice')}>
              {tr('nav.native')}
            </a>
            <a className={ui.btnGhost} href={lp(OPENMOUSE_HUB_PATH)}>
              {tr('nav.openMouse')}
            </a>
          </div>
          {mounted && !webHidOk ? (
            <p className={styles.warn}>{tr('connect.noWebHid')}</p>
          ) : null}
          <div className={styles.steps}>
            <MeasureLine index={1} label={tr('connect.step1')} />
            <MeasureLine index={2} label={tr('connect.step2')} />
            <MeasureLine index={3} label={tr('connect.step3')} />
          </div>
        </div>
        <HeroMiceSlider devices={nativeDevices} />
      </section>

      <section className={styles.section} id="mice">
        <header className={styles.sectionHead}>
          <h2>{tr('connect.supportedTitle')}</h2>
          <p>{tr('connect.supportedSub')}</p>
          <div className={styles.savedActions}>
            <a className={ui.btnPrimary} href={lp('/mice')}>
              {tr('connect.browseNative')}
            </a>
            <a className={ui.btnGhost} href={lp('/recent')}>
              {tr('nav.recent')}
            </a>
          </div>
        </header>
        <ul className={styles.deviceGrid}>
          {nativeDevices.map((d) => (
            <li key={d.id}>
              <a className={styles.deviceCard} href={lp(`/mice/${d.id}`)}>
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
                  <span className={styles.openCue}>{tr('connect.learnMore')} →</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.omSection} id="openmouse" aria-labelledby="om-home">
        <header className={styles.omHead}>
          <h2 id="om-home">{tr('connect.omTitle')}</h2>
          <p>{tr('connect.omSub')}</p>
          <div className={styles.omActions}>
            <a className={ui.btnPrimary} href={lp(OPENMOUSE_HUB_PATH)}>
              {tr('connect.omBrowseAll')} ({OPENMOUSE_CATALOG.length})
            </a>
            <p className={styles.savedOtherTip}>
              {omBrandCount} {tr('connect.omBrands').toLowerCase()}
            </p>
          </div>
        </header>
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
