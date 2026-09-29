import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/i18n/locale'
import { describeOpenMouseBrand, getOpenMouseBrandCounts, getOpenMouseBrands, getOpenMouseEntriesForBrand, openMouseImageUrl } from '@/devices/openmouse/catalog'
import { getOpenMouseCopy } from '@/devices/openmouse/i18n'
import { openMouseCatalogPage, openMousePageLabel, openMousePageNumber, openMousePagePath } from '@/devices/openmouse/pagination'
import { absoluteUrl, localePath, localizedAlternates } from '@/lib/seo'
import { OpenMouseHubClient } from '@/views/OpenMouseHub'

type Params = { lang: string; brand: string; page: string }

export const dynamicParams = false

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => getOpenMouseBrands().flatMap((brand) =>
    Array.from({ length: openMouseCatalogPage(1, brand).pageCount - 1 }, (_, index) =>
      ({ lang, brand, page: String(index + 2) }),
    ),
  ))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, brand, page: rawPage } = await params
  const page = openMousePageNumber(rawPage)
  const catalogPage = page ? openMouseCatalogPage(page, brand) : null
  if (!isLocale(lang) || !page || page < 2 || !catalogPage?.entries.length) return {}
  const locale = lang as Locale
  const brandName = catalogPage.entries[0].brand
  const suffix = openMousePageLabel(locale, page)
  const title = `${brandName} (OpenMouse) - ${suffix} | UMD · umdrivers.com`
  const description = `${describeOpenMouseBrand(brand, locale)} ${suffix}.`
  const relativePath = openMousePagePath(page, brand)
  const path = localePath(locale, relativePath)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(path), languages: localizedAlternates(relativePath) },
    openGraph: { title, description, url: absoluteUrl(path), images: [{ url: absoluteUrl(openMouseImageUrl(brand)) }] },
  }
}

export default async function OpenMouseBrandPageNumber({ params }: { params: Promise<Params> }) {
  const { lang, brand, page: rawPage } = await params
  const page = openMousePageNumber(rawPage)
  if (!isLocale(lang) || !page || page < 2) notFound()
  const catalogPage = openMouseCatalogPage(page, brand)
  if (!catalogPage.entries.length) notFound()
  const brandName = getOpenMouseEntriesForBrand(brand)[0].brand
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
      brandSlug={brand}
      title={`${brandName} · OpenMouse · ${openMousePageLabel(locale, page)}`}
      subtitle={describeOpenMouseBrand(brand, locale)}
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
