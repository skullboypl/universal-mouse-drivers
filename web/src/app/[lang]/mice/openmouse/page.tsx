import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/i18n/locale'
import { OPENMOUSE_CATALOG } from '@/devices/openmouse/catalog.generated'
import { absoluteUrl, localePath, localizedAlternates } from '@/lib/seo'
import { OpenMouseHubClient } from '@/views/OpenMouseHub'
import { getOpenMouseCopy } from '@/devices/openmouse/i18n'
import { openMouseCatalogPage } from '@/devices/openmouse/pagination'
import { getOpenMouseBrandCounts } from '@/devices/openmouse/catalog'

function copy(lang: Locale) {
  const c = getOpenMouseCopy(lang)
  return {
    title: `${c.hubTitle} | UMD · umdrivers.com`,
    description: c.hubDescription(OPENMOUSE_CATALOG.length),
    pageTitle: c.hubTitle,
    subtitle: c.hubSubtitle,
    searchPlaceholder: c.searchAll,
    namedOnlyLabel: c.namedOnly,
    allBrandsLabel: c.allBrands,
    openMouseCredit: 'OpenMouse protocol',
    connectLabel: c.connect,
    howTitle: c.howTitle,
    howBody: c.howBody,
    brandsTitle: c.brands,
    listTitle: c.mouseList,
    badgeNamed: c.named,
    badgeCommunity: 'OpenMouse',
    badgeWebhid: 'WebHID',
    emptyLabel: c.empty,
    legendNative: c.native,
    legendNativeHint: 'King Ultra · Blitz · Fenrir · Superlight',
    legendOmHint: c.openMouseHint,
    legendNamedHint: c.namedHint,
  }
}

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const c = copy(lang as Locale)
  const path = localePath(lang as Locale, '/mice/openmouse')
  return {
    title: { absolute: c.title },
    description: c.description,
    alternates: {
      canonical: absoluteUrl(path),
      languages: localizedAlternates('/mice/openmouse'),
    },
    openGraph: {
      title: c.title,
      description: c.description,
      url: absoluteUrl(path),
      images: [{ url: absoluteUrl('/devices/openmouse/mouse.svg') }],
    },
  }
}

export default async function OpenMouseHubPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const l = lang as Locale
  const c = copy(l)
  const catalogPage = openMouseCatalogPage(1)
  return (
    <OpenMouseHubClient
      lang={l}
      entries={catalogPage.entries}
      totalEntries={catalogPage.total}
      page={1}
      pageCount={catalogPage.pageCount}
      brandCounts={getOpenMouseBrandCounts()}
      title={c.pageTitle}
      subtitle={c.subtitle}
      searchPlaceholder={c.searchPlaceholder}
      namedOnlyLabel={c.namedOnlyLabel}
      allBrandsLabel={c.allBrandsLabel}
      openMouseCredit={c.openMouseCredit}
      connectHref="/"
      connectLabel={c.connectLabel}
      howTitle={c.howTitle}
      howBody={c.howBody}
      brandsTitle={c.brandsTitle}
      listTitle={c.listTitle}
      badgeNamed={c.badgeNamed}
      badgeCommunity={c.badgeCommunity}
      badgeWebhid={c.badgeWebhid}
      emptyLabel={c.emptyLabel}
      legendNative={c.legendNative}
      legendNativeHint={c.legendNativeHint}
      legendOmHint={c.legendOmHint}
      legendNamedHint={c.legendNamedHint}
    />
  )
}
