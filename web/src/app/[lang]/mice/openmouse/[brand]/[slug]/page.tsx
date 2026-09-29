import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/i18n/locale'
import {
  describeOpenMouseDevice,
  getOpenMouseEntry,
  getOpenMouseNamedEntries,
  openMouseDevicePath,
  openMouseImageUrl,
} from '@/devices/openmouse/catalog'
import { absoluteUrl, localePath, localizedAlternates } from '@/lib/seo'
import { OpenMouseDeviceView } from '@/views/OpenMouseDeviceView'
import { getOpenMouseCopy } from '@/devices/openmouse/i18n'

export function generateStaticParams() {
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
  const description = describeOpenMouseDevice(entry, lang)
  const title = `${entry.name} (${entry.brand}) · OpenMouse | UMD`
  const path = localePath(lang as Locale, openMouseDevicePath(brand, slug))
  return {
    title: { absolute: title },
    description,
    robots: entry.hasProductName ? undefined : { index: false, follow: true },
    alternates: {
      canonical: absoluteUrl(path),
      languages: localizedAlternates(openMouseDevicePath(brand, slug)),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      images: [{ url: absoluteUrl(openMouseImageUrl(entry.brandSlug, entry.name, entry.slug)) }],
    },
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
  const c = getOpenMouseCopy(l)
  return (
    <OpenMouseDeviceView
      lang={l}
      entry={entry}
      hubLabel="Community (OpenMouse)"
      connectLabel={c.connectShort}
      credit="OpenMouse protocol"
      badgeNamed={c.named}
      badgeCommunity="OpenMouse"
      badgeWebhid="WebHID"
      stepsTitle={c.stepsTitle}
      steps={c.steps}
    />
  )
}
