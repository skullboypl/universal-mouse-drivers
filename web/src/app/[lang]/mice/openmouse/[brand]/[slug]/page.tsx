import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/i18n/locale'
import {
  getOpenMouseEntry,
  getOpenMouseNamedEntries,
  openMouseDevicePath,
} from '@/devices/openmouse/catalog'
import { absoluteUrl, localePath } from '@/lib/seo'
import { OpenMouseDeviceView } from '@/views/OpenMouseDeviceView'

export function generateStaticParams() {
  // Named devices only (1A) — unnamed stay in hub search
  return LOCALES.flatMap((lang) =>
    getOpenMouseNamedEntries().map((e) => ({
      lang,
      brand: e.brandSlug,
      slug: e.slug,
    })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; brand: string; slug: string }>
}): Promise<Metadata> {
  const { lang, brand, slug } = await params
  if (!isLocale(lang)) return {}
  const entry = getOpenMouseEntry(brand, slug)
  if (!entry) return {}
  const title = `${entry.name} (${entry.brand}) · OpenMouse | UMD`
  const description = `${entry.name} via OpenMouse protocols in Universal Mouse Drivers (WebHID) at umdrivers.com.`
  const path = localePath(lang as Locale, openMouseDevicePath(brand, slug))
  const index = entry.hasProductName
  return {
    title,
    description,
    robots: index ? undefined : { index: false, follow: true },
    alternates: { canonical: absoluteUrl(path) },
    openGraph: { title, description, url: absoluteUrl(path) },
  }
}

export default async function OpenMouseDevicePage({
  params,
}: {
  params: Promise<{ lang: string; brand: string; slug: string }>
}) {
  const { lang, brand, slug } = await params
  if (!isLocale(lang)) notFound()
  const entry = getOpenMouseEntry(brand, slug)
  if (!entry) notFound()
  const l = lang as Locale
  return (
    <OpenMouseDeviceView
      lang={l}
      entry={entry}
      hubLabel="Community (OpenMouse)"
      connectLabel={l === 'pl' ? 'Połącz w UMD' : 'Connect in UMD'}
      credit="Protocol credit: OpenMouse Project"
    />
  )
}
