import type { Metadata } from 'next'
import type { Locale } from '@/i18n/locale'
import { DEVICE_SEO_ARTICLES, WHY_UMD, BATTERY_TRAY } from './seoContent'
import { getSiteUrl, SITE } from './site'

export type SeoPageId =
  | 'home'
  | 'settings'
  | 'sensor'
  | 'buttons'
  | 'macro'
  | 'why'
  | 'tray'
  | 'mouse-redragon-king-ultra'
  | 'mouse-gwolves-fenrir-max'
  | 'mouse-logitech-pro-x-superlight'

type Localized = Record<Locale, string>

export interface SeoPage {
  id: SeoPageId
  /** Path under /{lang}, e.g. "" or "/device/settings" */
  path: string
  title: Localized
  description: Localized
  /** Short label for OG image eyebrow */
  eyebrow: Localized
  /** Index in search engines (tool pages stay indexable as product docs). */
  index?: boolean
}

function mousePageId(slug: string): SeoPageId {
  return `mouse-${slug}` as SeoPageId
}

const mousePageEntries = DEVICE_SEO_ARTICLES.map((a) => {
  const id = mousePageId(a.slug)
  const page: SeoPage = {
    id,
    path: a.path,
    title: a.title,
    description: a.description,
    eyebrow: a.eyebrow,
  }
  return [id, page] as const
})

export const SEO_PAGES: Record<SeoPageId, SeoPage> = {
  home: {
    id: 'home',
    path: '',
    eyebrow: { pl: 'Połącz', en: 'Connect' },
    title: {
      pl: 'Połącz mysz - Universal Mouse Drivers',
      en: 'Connect mouse - Universal Mouse Drivers',
    },
    description: {
      pl: 'Sterowniki WebHID w przeglądarce dla Redragon King Ultra, G-Wolves Fenrir Max 8K i Logitech PRO X SUPERLIGHT. DPI, przyciski i profile bez instalacji OEM.',
      en: 'Browser WebHID drivers for Redragon King Ultra, G-Wolves Fenrir Max 8K and Logitech PRO X SUPERLIGHT. DPI, buttons and profiles without an OEM install.',
    },
  },
  why: {
    id: 'why',
    path: WHY_UMD.path,
    title: WHY_UMD.title,
    description: WHY_UMD.description,
    eyebrow: WHY_UMD.eyebrow,
  },
  tray: {
    id: 'tray',
    path: BATTERY_TRAY.path,
    title: BATTERY_TRAY.title,
    description: BATTERY_TRAY.description,
    eyebrow: BATTERY_TRAY.eyebrow,
  },
  'mouse-redragon-king-ultra': mousePageEntries.find(
    ([id]) => id === 'mouse-redragon-king-ultra',
  )![1],
  'mouse-gwolves-fenrir-max': mousePageEntries.find(
    ([id]) => id === 'mouse-gwolves-fenrir-max',
  )![1],
  'mouse-logitech-pro-x-superlight': mousePageEntries.find(
    ([id]) => id === 'mouse-logitech-pro-x-superlight',
  )![1],
  settings: {
    id: 'settings',
    path: '/device/settings',
    eyebrow: { pl: 'Ustawienia', en: 'Settings' },
    title: {
      pl: 'Ustawienia urządzenia - UMD',
      en: 'Device settings - UMD',
    },
    description: {
      pl: 'Firmware receivera i myszy, tryb uśpienia, język UI oraz link do UMD Battery Tray.',
      en: 'Receiver and mouse firmware, sleep mode, UI language, and a link to UMD Battery Tray.',
    },
  },
  sensor: {
    id: 'sensor',
    path: '/device/sensor',
    eyebrow: { pl: 'Sensor', en: 'Sensor' },
    title: {
      pl: 'Sensor i DPI - UMD',
      en: 'Sensor & DPI - UMD',
    },
    description: {
      pl: 'Konfiguracja PixArt PAW3395: DPI, polling rate, LOD, Peak i tryby zasilania King Ultra przez WebHID.',
      en: 'Configure PixArt PAW3395: DPI, polling rate, LOD, Peak and power modes for King Ultra over WebHID.',
    },
  },
  buttons: {
    id: 'buttons',
    path: '/device/buttons',
    eyebrow: { pl: 'Przyciski', en: 'Buttons' },
    title: {
      pl: 'Mapowanie przycisków - UMD',
      en: 'Button mapping - UMD',
    },
    description: {
      pl: 'Przypisz akcje do przycisków Redragon King Ultra bezpośrednio w przeglądarce.',
      en: 'Remap Redragon King Ultra buttons directly in the browser.',
    },
  },
  macro: {
    id: 'macro',
    path: '/device/macro',
    eyebrow: { pl: 'Makra', en: 'Macros' },
    title: {
      pl: 'Makra - UMD',
      en: 'Macros - UMD',
    },
    description: {
      pl: 'Edytor makr dla Universal Mouse Drivers - w przygotowaniu.',
      en: 'Macro editor for Universal Mouse Drivers - coming soon.',
    },
  },
}

export function localePath(lang: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : path ? `/${path}` : ''
  return `/${lang}${clean}`
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl()
  if (!path || path === '/') return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function ogImageUrl(page: SeoPageId, lang: Locale): string {
  // Home uses Next file-based OG (/{lang}/opengraph-image) - more reliable for Discord.
  if (page === 'home') {
    return absoluteUrl(`/${lang}/opengraph-image`)
  }
  const u = new URL('/og', getSiteUrl())
  u.searchParams.set('page', page)
  u.searchParams.set('lang', lang)
  return u.toString()
}

export function buildPageMetadata(
  pageId: SeoPageId,
  lang: Locale,
): Metadata {
  const page = SEO_PAGES[pageId]
  const title = page.title[lang]
  const description = page.description[lang]
  const canonicalPath = localePath(lang, page.path)
  const canonical = absoluteUrl(canonicalPath)
  const og = ogImageUrl(pageId, lang)
  const index = page.index !== false

  const languages: Record<string, string> = {}
  for (const loc of SITE.locales) {
    languages[loc] = localePath(loc, page.path)
  }
  languages['x-default'] = localePath('en', page.path)

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: lang === 'pl' ? 'pl_PL' : 'en_US',
      type: 'website',
      images: [
        {
          url: og,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [og],
      creator: SITE.twitterHandle,
    },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
  }
}

export function softwareApplicationJsonLd(lang: Locale) {
  const home = SEO_PAGES.home
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    alternateName: SITE.shortName,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Windows, Chrome, Edge',
    description: home.description[lang],
    url: absoluteUrl(localePath(lang, '')),
    image: ogImageUrl('home', lang),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'SkullMedia',
      email: 'github@skullmedia.pl',
      sameAs: [...SITE.sameAs],
    },
    inLanguage: lang,
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    alternateName: SITE.shortName,
    url: getSiteUrl(),
    inLanguage: [...SITE.locales],
    potentialAction: {
      '@type': 'ViewAction',
      target: absoluteUrl('/pl'),
    },
  }
}

export function seoPageIdForMouseSlug(slug: string): SeoPageId | null {
  const id = mousePageId(slug)
  return id in SEO_PAGES ? id : null
}
