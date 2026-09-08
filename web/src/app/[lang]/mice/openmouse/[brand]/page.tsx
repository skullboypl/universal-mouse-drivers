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
import { absoluteUrl, localePath } from '@/lib/seo'
import { OpenMouseHubClient } from '@/views/OpenMouseHub'

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
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
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
  const pl = l === 'pl'
  return (
    <OpenMouseHubClient
      lang={l}
      brandSlug={brand}
      title={`${brandName} · OpenMouse`}
      subtitle={describeOpenMouseBrand(brand, l)}
      searchPlaceholder={pl ? 'Szukaj w tej marce…' : 'Search in this brand…'}
      namedOnlyLabel={pl ? 'Tylko z nazwą modelu' : 'Named models only'}
      allBrandsLabel={brandName}
      openMouseCredit="OpenMouse protocol"
      connectHref="/"
      connectLabel={pl ? 'Połącz mysz w UMD' : 'Connect mouse in UMD'}
      howTitle={pl ? 'Ta marka w UMD' : 'This brand in UMD'}
      howBody={
        pl
          ? `${brandName} jest obsługiwana przez protokoły OpenMouse w UMD. Wybierz model z listy i połącz WebHID.`
          : `${brandName} is driven by OpenMouse protocols inside UMD. Pick a model from the list and connect via WebHID.`
      }
      brandsTitle={pl ? 'Marki' : 'Brands'}
      listTitle={pl ? `Myszy ${brandName}` : `${brandName} mice`}
      badgeNamed={pl ? 'Nazwa' : 'Named'}
      badgeCommunity="OpenMouse"
      badgeWebhid="WebHID"
      emptyLabel={pl ? 'Brak wyników.' : 'No matches.'}
      legendNative="UMD native"
      legendNativeHint="King Ultra · Blitz · Fenrir · Superlight"
      legendOmHint={
        pl
          ? 'Protokoły OpenMouse w UMD WebHID'
          : 'OpenMouse protocols in UMD WebHID'
      }
      legendNamedHint={
        pl
          ? 'Nazwa modelu z map OpenMouse'
          : 'Model name from OpenMouse maps'
      }
    />
  )
}
