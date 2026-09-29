import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/i18n/locale'
import { getOpenMouseBrandCounts } from '@/devices/openmouse/catalog'
import { getOpenMouseCopy } from '@/devices/openmouse/i18n'
import { openMouseCatalogPage, openMousePageLabel, openMousePageNumber, openMousePagePath } from '@/devices/openmouse/pagination'
import { absoluteUrl, localePath, localizedAlternates } from '@/lib/seo'
import { OpenMouseHubClient } from '@/views/OpenMouseHub'

type Params = { lang: string; page: string }

export const dynamicParams = false

export function generateStaticParams() {
  const count = openMouseCatalogPage(1).pageCount
  return LOCALES.flatMap((lang) =>
    Array.from({ length: count - 1 }, (_, index) => ({ lang, page: String(index + 2) })),
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, page: rawPage } = await params
  const page = openMousePageNumber(rawPage)
  if (!isLocale(lang) || !page || page < 2 || page > openMouseCatalogPage(1).pageCount) return {}
  const locale = lang as Locale
  const copy = getOpenMouseCopy(locale)
  const suffix = openMousePageLabel(locale, page)
  const title = `${copy.hubTitle} - ${suffix} | UMD · umdrivers.com`
  const description = `${copy.hubDescription(openMouseCatalogPage(1).total)} ${suffix}.`
  const relativePath = openMousePagePath(page)
  const path = localePath(locale, relativePath)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(path), languages: localizedAlternates(relativePath) },
    openGraph: { title, description, url: absoluteUrl(path), images: [{ url: absoluteUrl('/devices/openmouse/mouse.svg') }] },
  }
}

export default async function OpenMouseHubPageNumber({ params }: { params: Promise<Params> }) {
  const { lang, page: rawPage } = await params
  const page = openMousePageNumber(rawPage)
  if (!isLocale(lang) || !page || page < 2) notFound()
  const catalogPage = openMouseCatalogPage(page)
  if (!catalogPage.entries.length) notFound()
  const locale = lang as Locale
  const c = getOpenMouseCopy(locale)
  return (
    <OpenMouseHubClient
      lang={locale}
      entries={catalogPage.entries}
      totalEntries={catalogPage.total}
      page={page}
      pageCount={catalogPage.pageCount}
      brandCounts={getOpenMouseBrandCounts()}
      title={`${c.hubTitle} · ${openMousePageLabel(locale, page)}`}
      subtitle={c.hubSubtitle}
      searchPlaceholder={c.searchAll}
      namedOnlyLabel={c.namedOnly}
      allBrandsLabel={c.allBrands}
      openMouseCredit="OpenMouse protocol"
      connectHref="/"
      connectLabel={c.connect}
      howTitle={c.howTitle}
      howBody={c.howBody}
      brandsTitle={c.brands}
      listTitle={c.mouseList}
      badgeNamed={c.named}
      badgeCommunity="OpenMouse"
      badgeWebhid="WebHID"
      emptyLabel={c.empty}
      legendNative={c.native}
      legendNativeHint="King Ultra · Blitz · Fenrir · Superlight"
      legendOmHint={c.openMouseHint}
      legendNamedHint={c.namedHint}
    />
  )
}
