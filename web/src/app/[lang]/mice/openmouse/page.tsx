import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/i18n/locale'
import { absoluteUrl, localePath } from '@/lib/seo'
import { OpenMouseHubClient } from '@/views/OpenMouseHub'

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
  const title =
    lang === 'pl'
      ? 'Community mice (OpenMouse) | UMD · umdrivers.com'
      : 'Community mice (OpenMouse) | UMD · umdrivers.com'
  const description =
    'Browse OpenMouse-backed gaming mice in Universal Mouse Drivers — search and filter by brand, connect via WebHID.'
  const path = localePath(lang as Locale, '/mice/openmouse')
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: 'Universal Mouse Drivers',
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
  return (
    <OpenMouseHubClient
      lang={l}
      title={
        l === 'pl'
          ? 'Community devices (OpenMouse)'
          : 'Community devices (OpenMouse)'
      }
      subtitle={
        l === 'pl'
          ? 'Katalog myszy z protokołów OpenMouse — wyszukiwanie i filtr marek. Konfiguracja WebHID w UMD; kredyt dla OpenMouse Project.'
          : 'Mice from OpenMouse protocols — search and filter by brand. Configure over WebHID in UMD; credit to the OpenMouse Project.'
      }
      searchPlaceholder={
        l === 'pl' ? 'Szukaj nazwy, marki, VID:PID…' : 'Search name, brand, VID:PID…'
      }
      namedOnlyLabel={l === 'pl' ? 'Tylko z nazwą' : 'Named only'}
      allBrandsLabel={l === 'pl' ? 'Wszystkie marki' : 'All brands'}
      openMouseCredit="Protocols by OpenMouse Project"
      connectHref="/"
      connectLabel={l === 'pl' ? 'Połącz mysz' : 'Connect a mouse'}
    />
  )
}
