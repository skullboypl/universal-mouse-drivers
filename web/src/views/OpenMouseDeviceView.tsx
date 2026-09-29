'use client'

import Link from 'next/link'
import type { OpenMouseCatalogEntry } from '@/devices/openmouse/catalog.generated'
import {
  OPENMOUSE_HUB_PATH,
  describeOpenMouseDevice,
  formatVidPid,
  openMouseBrandPath,
} from '@/devices/openmouse/catalog'
import { OpenMouseProductMark } from '@/components/OpenMouseProductMark'
import {
  getOpenMouseCapabilityCopy,
  visibleOpenMouseControls,
} from '@/devices/openmouse/capabilityPresentation'
import type { Locale } from '@/i18n/locale'
import { localePath } from '@/lib/seo'
import styles from './OpenMouseHub.module.css'

type Props = {
  lang: Locale
  entry: OpenMouseCatalogEntry
  connectLabel: string
  hubLabel: string
  credit: string
  stepsTitle: string
  steps: [string, string, string]
  badgeNamed: string
  badgeCommunity: string
  badgeWebhid: string
}

export function OpenMouseDeviceView({
  lang,
  entry,
  connectLabel,
  hubLabel,
  credit,
  stepsTitle,
  steps,
  badgeNamed,
  badgeCommunity,
  badgeWebhid,
}: Props) {
  const lp = (path: string) => localePath(lang, path)
  const vidPid = formatVidPid(entry.vendorId, entry.productId)
  const description = describeOpenMouseDevice(entry, lang)
  const capabilityCopy = getOpenMouseCapabilityCopy(lang)
  const controls = visibleOpenMouseControls(entry)

  return (
    <article className={styles.wrap}>
      <p className={styles.eyebrow}>
        <Link href={lp(OPENMOUSE_HUB_PATH)}>{hubLabel}</Link>
        {' / '}
        <Link href={lp(openMouseBrandPath(entry.brandSlug))}>{entry.brand}</Link>
      </p>

      <div className={styles.deviceHero}>
        <figure className={styles.deviceHeroArt}>
          <OpenMouseProductMark
            brandSlug={entry.brandSlug}
            brand={entry.brand}
            model={entry.name}
            slug={entry.slug}
            size="lg"
            decorative={false}
          />
        </figure>
        <div className={styles.deviceCopy}>
          <div className={styles.pills}>
            <span className={`${styles.pill} ${styles.pillOm}`}>{badgeCommunity}</span>
            <span className={`${styles.pill} ${styles.pillWebhid}`}>{badgeWebhid}</span>
            {entry.hasProductName ? (
              <span className={`${styles.pill} ${styles.pillNamed}`}>{badgeNamed}</span>
            ) : null}
          </div>
          <p className={styles.cardBrand}>{entry.brand}</p>
          <h1>{entry.name}</h1>
          <p className={styles.deviceLead}>{description}</p>
          <p className={styles.deviceMetaRow}>
            <span className={styles.meta}>HID {vidPid}</span>
          </p>
          <div className={styles.headActions}>
            <Link className={styles.cta} href={lp('/')}>
              {connectLabel}
            </Link>
            <a
              className={styles.ctaGhost}
              href="https://github.com/OpenMouse-Project/mouse-protocol"
              target="_blank"
              rel="noreferrer"
            >
              {credit}
            </a>
          </div>
        </div>
      </div>

      <section className={styles.capabilityPanel} aria-labelledby="openmouse-capabilities">
        <div className={styles.capabilityHeader}>
          <div>
            <p className={styles.sectionIndex}>01 / DEVICE CONTROL</p>
            <h2 id="openmouse-capabilities">{capabilityCopy.title}</h2>
          </div>
          <span className={styles.driverName}>
            {capabilityCopy.driver}: {entry.capabilities.driver ?? capabilityCopy.unknown}
          </span>
        </div>

        <dl className={styles.capabilityGrid}>
          {controls.map((control) => (
            <div key={control.key} className={styles.capabilityItem}>
              <dt>{control.label}</dt>
              <dd data-state={control.state}>
                {control.state === 'driver' ? capabilityCopy.verified : capabilityCopy.runtime}
              </dd>
            </div>
          ))}
          {entry.capabilities.dpiRange ? (
            <div className={styles.capabilityItem}>
              <dt>{capabilityCopy.dpiRange}</dt>
              <dd>{entry.capabilities.dpiRange.min.toLocaleString()}-{entry.capabilities.dpiRange.max.toLocaleString()} DPI</dd>
            </div>
          ) : null}
          {entry.capabilities.pollingRatesHz ? (
            <div className={styles.capabilityItem}>
              <dt>{capabilityCopy.pollingRates}</dt>
              <dd>{entry.capabilities.pollingRatesHz.map((rate) => `${rate.toLocaleString()} Hz`).join(' · ')}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className={styles.steps}>
        <h2>{stepsTitle}</h2>
        <ol>
          <li>{steps[0]}</li>
          <li>{steps[1]}</li>
          <li>{steps[2]}</li>
        </ol>
      </section>
    </article>
  )
}
