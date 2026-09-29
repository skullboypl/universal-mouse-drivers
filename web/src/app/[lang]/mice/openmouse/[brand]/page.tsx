import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/i18n/locale'
import {
  describeOpenMouseBrand,
  getOpenMouseBrands,
  getOpenMouseEntriesForBrand,
  openMouseBrandPath,
  openMouseImageUrl,
} from '@/devices/openmouse/catalog'
import { absoluteUrl, localePath, localizedAlternates } from '@/lib/seo'
import { OpenMouseHubClient } from '@/views/OpenMouseHub'
import { getOpenMouseCopy } from '@/devices/openmouse/i18n'
import { openMouseCatalogPage } from '@/devices/openmouse/pagination'
import { getOpenMouseBrandCounts } from '@/devices/openmouse/catalog'

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    getOpenMouseBrands().map((brand) => ({ lang, brand })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; brand: string }>
}): Promise<Metadata> {
  const { lang, brand } = await params
  if (!isLocale(lang)) return {}
  const entries = getOpenMouseEntriesForBrand(brand)
  if (!entries.length) return {}
  const brandName = entries[0].brand
  const description = describeOpenMouseBrand(brand, lang)
  const title = `${brandName} (OpenMouse) | UMD · umdrivers.com`
  const path = localePath(lang as Locale, openMouseBrandPath(brand))
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: absoluteUrl(path),
      languages: localizedAlternates(openMouseBrandPath(brand)),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      images: [{ url: absoluteUrl(openMouseImageUrl(brand)) }],
    },
  }
}

export default async function OpenMouseBrandPage({
  params,
}: {
  params: Promise<{ lang: string; brand: string }>
}) {
  const { lang, brand } = await params
  if (!isLocale(lang)) notFound()
  const entries = getOpenMouseEntriesForBrand(brand)
  if (!entries.length) notFound()
  const brandName = entries[0].brand
  const l = lang as Locale
  const c = getOpenMouseCopy(l)
  const catalogPage = openMouseCatalogPage(1, brand)
  return (
    <OpenMouseHubClient
      lang={l}
      entries={catalogPage.entries}
      totalEntries={catalogPage.total}
      page={1}
      pageCount={catalogPage.pageCount}
      brandCounts={getOpenMouseBrandCounts()}
      brandSlug={brand}
      title={`${brandName} · OpenMouse`}
      subtitle={describeOpenMouseBrand(brand, l)}
      searchPlaceholder={c.searchBrand}
      namedOnlyLabel={c.namedOnly}
      allBrandsLabel={brandName}
      openMouseCredit="OpenMouse protocol"
      connectHref="/"
      connectLabel={c.connect}
      howTitle={c.brandHowTitle}
      howBody={c.brandHowBody(brandName)}
      brandsTitle={c.brands}
      listTitle={c.brandMouseList(brandName)}
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
