import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/i18n/locale'
import { OPENMOUSE_CATALOG } from '@/devices/openmouse/catalog.generated'
import { absoluteUrl, localePath } from '@/lib/seo'
import { OpenMouseHubClient } from '@/views/OpenMouseHub'

function copy(lang: Locale) {
  const pl = lang === 'pl'
  return {
    title: pl
      ? 'Community mice (OpenMouse) | UMD · umdrivers.com'
      : 'Community mice (OpenMouse) | UMD · umdrivers.com',
    description: pl
      ? `Katalog ${OPENMOUSE_CATALOG.length} urządzeń OpenMouse w Universal Mouse Drivers - wyszukiwanie, marki, WebHID. Bez ciężkiego OEM.`
      : `Browse ${OPENMOUSE_CATALOG.length} OpenMouse devices in Universal Mouse Drivers - search, brands, WebHID. No heavy OEM installer.`,
    pageTitle: pl ? 'Community devices (OpenMouse)' : 'Community devices (OpenMouse)',
    subtitle: pl
      ? 'To nie są native UMD (King / Blitz). To myszy z protokołów OpenMouse - wybierz markę, znajdź model i połącz w Chrome/Edge.'
      : 'These are not UMD-native SKUs (King / Blitz). They use OpenMouse protocols - pick a brand, find your model, connect in Chrome/Edge.',
    searchPlaceholder: pl ? 'Szukaj nazwy, marki, VID:PID…' : 'Search name, brand, VID:PID…',
    namedOnlyLabel: pl ? 'Tylko z nazwą modelu' : 'Named models only',
    allBrandsLabel: pl ? 'Wszystkie marki' : 'All brands',
    openMouseCredit: 'OpenMouse protocol',
    connectLabel: pl ? 'Połącz mysz w UMD' : 'Connect mouse in UMD',
    howTitle: pl ? 'Jak to działa?' : 'How does this work?',
    howBody: pl
      ? 'UMD native = pełny UI dla King Ultra, Blitz Ultimate, Fenrir, Superlight. Community = urządzenia wykrywane przez OpenMouse - wspólna karta WebHID z badge’ami marki.'
      : 'UMD native = full UI for King Ultra, Blitz Ultimate, Fenrir, Superlight. Community = devices detected via OpenMouse - shared WebHID surface with brand badges.',
    brandsTitle: pl ? 'Marki' : 'Brands',
    listTitle: pl ? 'Lista myszek' : 'Mouse list',
    badgeNamed: pl ? 'Nazwa' : 'Named',
    badgeCommunity: 'OpenMouse',
    badgeWebhid: 'WebHID',
    emptyLabel: pl ? 'Brak wyników - zmień filtr lub wyszukiwanie.' : 'No matches - change filters or search.',
    legendNative: pl ? 'UMD native' : 'UMD native',
    legendNativeHint: 'King Ultra · Blitz · Fenrir · Superlight',
    legendOmHint: pl
      ? 'Protokoły OpenMouse w UMD WebHID'
      : 'OpenMouse protocols in UMD WebHID',
    legendNamedHint: pl
      ? 'Nazwa modelu z map OpenMouse'
      : 'Model name from OpenMouse maps',
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
    title: c.title,
    description: c.description,
    alternates: { canonical: absoluteUrl(path) },
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
  return (
    <OpenMouseHubClient
      lang={l}
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
