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
