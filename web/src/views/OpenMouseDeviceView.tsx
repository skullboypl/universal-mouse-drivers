'use client'

import Link from 'next/link'
import type { OpenMouseCatalogEntry } from '@/devices/openmouse/catalog.generated'
import {
  OPENMOUSE_HUB_PATH,
  openMouseBrandPath,
  openMouseImageUrl,
} from '@/devices/openmouse/catalog'
import type { Locale } from '@/i18n/locale'
import { localePath } from '@/lib/seo'
import styles from './OpenMouseHub.module.css'

type Props = {
  lang: Locale
  entry: OpenMouseCatalogEntry
  connectLabel: string
  hubLabel: string
  credit: string
}

export function OpenMouseDeviceView({
  lang,
  entry,
  connectLabel,
  hubLabel,
  credit,
}: Props) {
  const lp = (path: string) => localePath(lang, path)
  const vidPid = `${entry.vendorId.toString(16).padStart(4, '0')}:${entry.productId.toString(16).padStart(4, '0')}`

  return (
    <article className={styles.wrap}>
      <p className={styles.eyebrow}>
        <Link href={lp(OPENMOUSE_HUB_PATH)}>{hubLabel}</Link>
        {' · '}
        <Link href={lp(openMouseBrandPath(entry.brandSlug))}>{entry.brand}</Link>
      </p>
      <div className={styles.art} style={{ justifyContent: 'start', minHeight: '10rem' }}>
        <img src={openMouseImageUrl()} alt="" width={160} height={186} />
        <span className={styles.badge}>{entry.brand}</span>
      </div>
      <h1>{entry.name}</h1>
      <p className={styles.sub}>
        OpenMouse community device · HID <code>{vidPid}</code>
        {entry.hasProductName ? '' : ' · generic label'}
      </p>
      <p className={styles.credit}>
        <a
          href="https://github.com/OpenMouse-Project/mouse-protocol"
          target="_blank"
          rel="noreferrer"
        >
          {credit}
        </a>
      </p>
      <p>
        <Link className={styles.cta} href={lp('/')}>
          {connectLabel}
        </Link>
      </p>
    </article>
  )
}
