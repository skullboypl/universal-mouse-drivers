import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/i18n/locale'
import {
  getOpenMouseBrands,
  getOpenMouseEntriesForBrand,
  openMouseBrandPath,
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
  const title = `${brandName} (OpenMouse) | UMD · umdrivers.com`
  const description = `OpenMouse-backed ${brandName} mice in Universal Mouse Drivers — WebHID community support.`
  const path = localePath(lang as Locale, openMouseBrandPath(brand))
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: { title, description, url: absoluteUrl(path) },
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
  return (
    <OpenMouseHubClient
      lang={l}
      brandSlug={brand}
      title={`${brandName} · OpenMouse`}
      subtitle={
        l === 'pl'
          ? `Modele ${brandName} z katalogu OpenMouse w UMD.`
          : `${brandName} models from the OpenMouse catalog in UMD.`
      }
      searchPlaceholder={
        l === 'pl' ? 'Szukaj w tej marce…' : 'Search in this brand…'
      }
      namedOnlyLabel={l === 'pl' ? 'Tylko z nazwą' : 'Named only'}
      allBrandsLabel={brandName}
      openMouseCredit="Protocols by OpenMouse Project"
      connectHref="/"
      connectLabel={l === 'pl' ? 'Połącz mysz' : 'Connect a mouse'}
    />
  )
}
