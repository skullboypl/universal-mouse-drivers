'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  OPENMOUSE_CATALOG,
  type OpenMouseCatalogEntry,
} from '@/devices/openmouse/catalog.generated'
import {
  OPENMOUSE_HUB_PATH,
  openMouseBrandPath,
  openMouseDevicePath,
  openMouseImageUrl,
} from '@/devices/openmouse/catalog'
import type { Locale } from '@/i18n/locale'
import { localePath } from '@/lib/seo'
import styles from './OpenMouseHub.module.css'

type Props = {
  lang: Locale
  /** When set, lock filter to this brand slug */
  brandSlug?: string
  title: string
  subtitle: string
  searchPlaceholder: string
  namedOnlyLabel: string
  allBrandsLabel: string
  openMouseCredit: string
  connectHref: string
  connectLabel: string
}

export function OpenMouseHubClient({
  lang,
  brandSlug,
  title,
  subtitle,
  searchPlaceholder,
  namedOnlyLabel,
  allBrandsLabel,
  openMouseCredit,
  connectHref,
  connectLabel,
}: Props) {
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState(brandSlug ?? '')
  const [namedOnly, setNamedOnly] = useState(true)
  const deferredQ = useDeferredValue(q.trim().toLowerCase())

  const brands = useMemo(() => {
    const set = new Set(OPENMOUSE_CATALOG.map((e) => e.brandSlug))
    return [...set].sort()
  }, [])

  const filtered = useMemo(() => {
    return OPENMOUSE_CATALOG.filter((e) => {
      if (brandSlug && e.brandSlug !== brandSlug) return false
      if (!brandSlug && brand && e.brandSlug !== brand) return false
      if (namedOnly && !e.hasProductName) return false
      if (!deferredQ) return true
      const hay = `${e.name} ${e.brand} ${e.vendorId.toString(16)}:${e.productId.toString(16)} ${e.slug}`.toLowerCase()
      return hay.includes(deferredQ)
    })
  }, [brand, brandSlug, deferredQ, namedOnly])

  const lp = (path: string) => localePath(lang, path)

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          <Link href={lp(OPENMOUSE_HUB_PATH)}>UMD × OpenMouse</Link>
        </p>
        <h1>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>
        <p className={styles.credit}>
          <a
            href="https://github.com/OpenMouse-Project/mouse-protocol"
            target="_blank"
            rel="noreferrer"
          >
            {openMouseCredit}
          </a>
        </p>
        <p>
          <Link className={styles.cta} href={lp(connectHref)}>
            {connectLabel}
          </Link>
        </p>
      </header>

      <div className={styles.controls}>
        <input
          className={styles.search}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
        {!brandSlug ? (
          <select
            className={styles.select}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            aria-label={allBrandsLabel}
          >
            <option value="">{allBrandsLabel}</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {OPENMOUSE_CATALOG.find((e) => e.brandSlug === b)?.brand ?? b}
              </option>
            ))}
          </select>
        ) : null}
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={namedOnly}
            onChange={(e) => setNamedOnly(e.target.checked)}
          />
          {namedOnlyLabel}
        </label>
      </div>

      <p className={styles.count}>{filtered.length} devices</p>

      <ul className={styles.grid}>
        {filtered.map((e) => (
          <li key={e.id}>
            <CatalogCard entry={e} href={lp(openMouseDevicePath(e.brandSlug, e.slug))} brandHref={lp(openMouseBrandPath(e.brandSlug))} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function CatalogCard({
  entry,
  href,
  brandHref,
}: {
  entry: OpenMouseCatalogEntry
  href: string
  brandHref: string
}) {
  const vidPid = `${entry.vendorId.toString(16).padStart(4, '0')}:${entry.productId.toString(16).padStart(4, '0')}`
  return (
    <article className={styles.card}>
      <Link href={href} className={styles.cardMain}>
        <div className={styles.art}>
          <img src={openMouseImageUrl()} alt="" width={120} height={140} />
          <span className={styles.badge}>{entry.brand}</span>
        </div>
        <h2>{entry.name}</h2>
        <p className={styles.meta}>{vidPid}</p>
      </Link>
      <Link href={brandHref} className={styles.brandLink}>
        {entry.brand}
      </Link>
    </article>
  )
}
