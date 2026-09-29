'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  type OpenMouseCatalogEntry,
} from '@/devices/openmouse/catalog.generated'
import {
  OPENMOUSE_HUB_PATH,
  describeOpenMouseDevice,
  formatVidPid,
  openMouseBrandPath,
  openMouseDevicePath,
  openMouseLogoUrl,
} from '@/devices/openmouse/catalog'
import { OpenMouseProductMark } from '@/components/OpenMouseProductMark'
import {
  getOpenMouseCapabilityCopy,
  visibleOpenMouseControls,
} from '@/devices/openmouse/capabilityPresentation'
import type { Locale } from '@/i18n/locale'
import { localePath } from '@/lib/seo'
import { OPENMOUSE_PAGINATION_COPY, openMousePagePath } from '@/devices/openmouse/pagination'
import styles from './OpenMouseHub.module.css'

type Props = {
  lang: Locale
  entries: OpenMouseCatalogEntry[]
  totalEntries: number
  page: number
  pageCount: number
  brandCounts: ReturnType<typeof import('@/devices/openmouse/catalog').getOpenMouseBrandCounts>
  brandSlug?: string
  title: string
  subtitle: string
  searchPlaceholder: string
  namedOnlyLabel: string
  allBrandsLabel: string
  openMouseCredit: string
  connectHref: string
  connectLabel: string
  howTitle: string
  howBody: string
  brandsTitle: string
  listTitle: string
  badgeNamed: string
  badgeCommunity: string
  badgeWebhid: string
  emptyLabel: string
  legendNative: string
  legendNativeHint: string
  legendOmHint: string
  legendNamedHint: string
}

export function OpenMouseHubClient({
  lang,
  entries,
  totalEntries,
  page,
  pageCount,
  brandCounts,
  brandSlug,
  title,
  subtitle,
  searchPlaceholder,
  namedOnlyLabel,
  allBrandsLabel,
  openMouseCredit,
  connectHref,
  connectLabel,
  howTitle,
  howBody,
  brandsTitle,
  listTitle,
  badgeNamed,
  badgeCommunity,
  badgeWebhid,
  emptyLabel,
  legendNative,
  legendNativeHint,
  legendOmHint,
  legendNamedHint,
}: Props) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [namedOnly, setNamedOnly] = useState(false)
  const deferredQ = useDeferredValue(q.trim().toLowerCase())

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (namedOnly && !e.hasProductName) return false
      if (!deferredQ) return true
      const hay =
        `${e.name} ${e.brand} ${formatVidPid(e.vendorId, e.productId)} ${e.slug}`.toLowerCase()
      return hay.includes(deferredQ)
    })
  }, [entries, deferredQ, namedOnly])

  const lp = (path: string) => localePath(lang, path)

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          <Link href={lp('/')}>UMD</Link>
          <span aria-hidden> / </span>
          <Link href={lp(OPENMOUSE_HUB_PATH)}>OpenMouse</Link>
        </p>
        <h1>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>
        <div className={styles.headActions}>
          <Link className={styles.cta} href={lp(connectHref)}>
            {connectLabel}
          </Link>
          <a
            className={styles.ctaGhost}
            href="https://github.com/OpenMouse-Project/mouse-protocol"
            target="_blank"
            rel="noreferrer"
          >
            {openMouseCredit}
          </a>
        </div>
      </header>

      <section className={styles.how} aria-labelledby="om-how">
        <h2 id="om-how">{howTitle}</h2>
        <p>{howBody}</p>
        <ul className={styles.legend}>
          <li>
            <span className={`${styles.pill} ${styles.pillLive}`}>{legendNative}</span>
            {legendNativeHint}
          </li>
          <li>
            <span className={`${styles.pill} ${styles.pillOm}`}>{badgeCommunity}</span>
            {legendOmHint}
          </li>
          <li>
            <span className={`${styles.pill} ${styles.pillNamed}`}>{badgeNamed}</span>
            {legendNamedHint}
          </li>
        </ul>
      </section>

      {!brandSlug ? (
        <section className={styles.brands} aria-labelledby="om-brands">
          <div className={styles.brandsHead}>
            <h2 id="om-brands">{brandsTitle}</h2>
            <p className={styles.brandsMeta}>
              {brandCounts.length} brands · {totalEntries} HID ids
            </p>
          </div>
          <ul className={styles.brandChips}>
            <li>
              <Link
                className={`${styles.chip} ${!brandSlug ? styles.chipActive : ''}`}
                href={lp(OPENMOUSE_HUB_PATH)}
              >
                {allBrandsLabel}
                <span className={styles.chipCount}>{totalEntries}</span>
              </Link>
            </li>
            {brandCounts.map((b) => (
              <li key={b.brandSlug}>
                <Link
                  href={lp(openMouseBrandPath(b.brandSlug))}
                  className={styles.chip}
                >
                  <img
                    className={styles.chipArt}
                    src={openMouseLogoUrl(b.brandSlug)}
                    alt=""
                    width={28}
                    height={28}
                    onError={(event) => {
                      const image = event.currentTarget
                      const generic = '/devices/openmouse/mouse.svg'
                      if (!image.src.endsWith(generic)) image.src = generic
                      else image.hidden = true
                    }}
                  />
                  <span>{b.brand}</span>
                  <span className={styles.chipCount}>{b.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.listSection} aria-labelledby="om-list">
        <div className={styles.listHead}>
          <h2 id="om-list">{listTitle}</h2>
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
                value=""
                onChange={(e) => router.push(lp(e.target.value ? openMouseBrandPath(e.target.value) : OPENMOUSE_HUB_PATH))}
                aria-label={allBrandsLabel}
              >
                <option value="">{allBrandsLabel}</option>
                {brandCounts.map((b) => (
                  <option key={b.brandSlug} value={b.brandSlug}>
                    {b.brand} ({b.count})
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
          <p className={styles.count}>
            {filtered.length} / {entries.length} ({Math.min((page - 1) * 24 + 1, totalEntries)}-{Math.min(page * 24, totalEntries)} / {totalEntries})
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className={styles.empty}>{emptyLabel}</p>
        ) : (
          <ul className={styles.grid}>
            {filtered.map((e) => (
              <li key={e.id}>
                <CatalogCard
                  entry={e}
                  lang={lang}
                  href={lp(openMouseDevicePath(e.brandSlug, e.slug))}
                  brandHref={lp(openMouseBrandPath(e.brandSlug))}
                  description={describeOpenMouseDevice(e, lang)}
                  badgeNamed={badgeNamed}
                  badgeCommunity={badgeCommunity}
                  badgeWebhid={badgeWebhid}
                />
              </li>
            ))}
          </ul>
        )}
        {pageCount > 1 ? (
          <nav className={styles.pagination} aria-label={OPENMOUSE_PAGINATION_COPY[lang].navigation}>
            {page > 1 ? (
              <Link
                className={styles.pageLink}
                href={lp(openMousePagePath(page - 1, brandSlug))}
              >
                {OPENMOUSE_PAGINATION_COPY[lang].previous}
              </Link>
            ) : null}
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <Link
                key={number}
                className={number === page ? styles.pageCurrent : styles.pageLink}
                href={lp(openMousePagePath(number, brandSlug))}
                aria-current={number === page ? 'page' : undefined}
              >
                {number}
              </Link>
            ))}
            {page < pageCount ? (
              <Link
                className={styles.pageLink}
                href={lp(openMousePagePath(page + 1, brandSlug))}
              >
                {OPENMOUSE_PAGINATION_COPY[lang].next}
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </div>
  )
}

function CatalogCard({
  entry,
  lang,
  href,
  brandHref,
  description,
  badgeNamed,
  badgeCommunity,
  badgeWebhid,
}: {
  entry: OpenMouseCatalogEntry
  lang: Locale
  href: string
  brandHref: string
  description: string
  badgeNamed: string
  badgeCommunity: string
  badgeWebhid: string
}) {
  const vidPid = formatVidPid(entry.vendorId, entry.productId)
  const capabilityCopy = getOpenMouseCapabilityCopy(lang)
  const controls = visibleOpenMouseControls(entry)
  return (
    <article className={styles.card}>
      <Link href={href} className={styles.cardMain}>
        <div className={styles.art}>
          <OpenMouseProductMark
            brandSlug={entry.brandSlug}
            brand={entry.brand}
            model={entry.name}
            slug={entry.slug}
            size="md"
          />
        </div>
        <div className={styles.cardBody}>
          <div className={styles.pills}>
            <span className={`${styles.pill} ${styles.pillOm}`}>{badgeCommunity}</span>
            <span className={`${styles.pill} ${styles.pillWebhid}`}>{badgeWebhid}</span>
            {entry.hasProductName ? (
              <span className={`${styles.pill} ${styles.pillNamed}`}>{badgeNamed}</span>
            ) : null}
          </div>
          <p className={styles.cardBrand}>{entry.brand}</p>
          <h2>{entry.name}</h2>
          <p className={styles.meta}>{vidPid}</p>
          <p className={styles.cardDesc}>{description}</p>
          <div className={styles.cardCapabilities} aria-label={capabilityCopy.title}>
            <span className={styles.capabilityCount}>
              {capabilityCopy.availableCount(controls.length)}
            </span>
            {controls.slice(0, 4).map((control) => (
              <span key={control.key}>{control.label}</span>
            ))}
          </div>
        </div>
      </Link>
      <Link href={brandHref} className={styles.brandLink}>
        {entry.brand} →
      </Link>
    </article>
  )
}
