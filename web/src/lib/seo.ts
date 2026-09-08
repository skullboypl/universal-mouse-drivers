import type { Metadata } from 'next'
import type { Locale } from '@/i18n/locale'
import { LOCALES, LOCALE_HTML_LANG } from '@/i18n/locale'
import { DEVICE_SEO_ARTICLES, WHY_UMD, BATTERY_TRAY } from './seoContent'
import { L, OG_LOCALE_TAG, type L10nString } from './l10n'
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
  | 'mouse-rampage-blitz-ultimate'
  | 'mouse-gwolves-fenrir-max'
  | 'mouse-logitech-pro-x-superlight'

export interface SeoPage {
  id: SeoPageId
  /** Path under /{lang}, e.g. "" or "/device/settings" */
  path: string
  title: L10nString
  description: L10nString
  /** Short label for OG image eyebrow */
  eyebrow: L10nString
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
    eyebrow: {
      pl: 'Połącz',
      en: 'Connect',
      de: 'Verbinden',
      fr: 'Connecter',
      es: 'Conectar',
      pt: 'Ligar',
      it: 'Collega',
      zh: '连接',
      ja: '接続',
      ko: '연결',
      ru: 'Подключить',
    },
    title: {
      pl: 'Universal Mouse Drivers (UMD) - sterowniki WebHID | umdrivers.com',
      en: 'Universal Mouse Drivers (UMD) - WebHID mouse drivers | umdrivers.com',
      de: 'Universal Mouse Drivers (UMD) - WebHID-Maus-Treiber | umdrivers.com',
      fr: 'Universal Mouse Drivers (UMD) - pilotes souris WebHID | umdrivers.com',
      es: 'Universal Mouse Drivers (UMD) - drivers WebHID para ratón | umdrivers.com',
      pt: 'Universal Mouse Drivers (UMD) - drivers WebHID para rato | umdrivers.com',
      it: 'Universal Mouse Drivers (UMD) - driver mouse WebHID | umdrivers.com',
      zh: 'Universal Mouse Drivers (UMD) - WebHID 鼠标驱动 | umdrivers.com',
      ja: 'Universal Mouse Drivers (UMD) - WebHID マウスドライバー | umdrivers.com',
      ko: 'Universal Mouse Drivers (UMD) - WebHID 마우스 드라이버 | umdrivers.com',
      ru: 'Universal Mouse Drivers (UMD) - WebHID-драйверы мыши | umdrivers.com',
    },
    description: {
      pl: 'Oficjalna strona umdrivers.com: darmowe sterowniki WebHID (Chrome/Edge). Live: Redragon King Ultra, Rampage Blitz Ultimate. WIP: Fenrir Max 8K, PRO X SUPERLIGHT. DPI, przyciski, profile + opcjonalny Battery Tray.',
      en: 'Official site umdrivers.com: free WebHID drivers (Chrome/Edge). Live: Redragon King Ultra, Rampage Blitz Ultimate. WIP: Fenrir Max 8K, PRO X SUPERLIGHT. DPI, buttons, profiles + optional Battery Tray.',
      de: 'Offizielle Seite umdrivers.com: kostenlose WebHID-Treiber (Chrome/Edge). Live: Redragon King Ultra, Rampage Blitz Ultimate. WIP: Fenrir Max 8K, PRO X SUPERLIGHT. DPI, Tasten, Profile + optional Battery Tray.',
      fr: 'Site officiel umdrivers.com : pilotes WebHID gratuits (Chrome/Edge). Live : Redragon King Ultra, Rampage Blitz Ultimate. WIP : Fenrir Max 8K, PRO X SUPERLIGHT. DPI, boutons, profils + Battery Tray optionnel.',
      es: 'Sitio oficial umdrivers.com: drivers WebHID gratis (Chrome/Edge). Live: Redragon King Ultra, Rampage Blitz Ultimate. WIP: Fenrir Max 8K, PRO X SUPERLIGHT. DPI, botones, perfiles + Battery Tray opcional.',
      pt: 'Site oficial umdrivers.com: drivers WebHID grátis (Chrome/Edge). Live: Redragon King Ultra, Rampage Blitz Ultimate. WIP: Fenrir Max 8K, PRO X SUPERLIGHT. DPI, botões, perfis + Battery Tray opcional.',
      it: 'Sito ufficiale umdrivers.com: driver WebHID gratis (Chrome/Edge). Live: Redragon King Ultra, Rampage Blitz Ultimate. WIP: Fenrir Max 8K, PRO X SUPERLIGHT. DPI, pulsanti, profili + Battery Tray opzionale.',
      zh: '官网 umdrivers.com：免费 WebHID 驱动（Chrome/Edge）。Live：Redragon King Ultra、Rampage Blitz Ultimate。WIP：Fenrir Max 8K、PRO X SUPERLIGHT。DPI、按键、配置 + 可选 Battery Tray。',
      ja: '公式サイト umdrivers.com：無料 WebHID ドライバー（Chrome/Edge）。Live：Redragon King Ultra、Rampage Blitz Ultimate。WIP：Fenrir Max 8K、PRO X SUPERLIGHT。DPI・ボタン・プロファイル + 任意の Battery Tray。',
      ko: '공식 사이트 umdrivers.com: 무료 WebHID 드라이버(Chrome/Edge). Live: Redragon King Ultra, Rampage Blitz Ultimate. WIP: Fenrir Max 8K, PRO X SUPERLIGHT. DPI, 버튼, 프로필 + 선택적 Battery Tray.',
      ru: 'Официальный сайт umdrivers.com: бесплатные WebHID-драйверы (Chrome/Edge). Live: Redragon King Ultra, Rampage Blitz Ultimate. WIP: Fenrir Max 8K, PRO X SUPERLIGHT. DPI, кнопки, профили + опциональный Battery Tray.',
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
  'mouse-rampage-blitz-ultimate': mousePageEntries.find(
    ([id]) => id === 'mouse-rampage-blitz-ultimate',
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
  // Static PNGs in /public/og - CapRover next/og ImageResponse 502s; Discord needs a real .png.
  // ?v= busts Discord/CDN cache after regenerating assets.
  const v = '2'
  const assetLang = lang === 'pl' ? 'pl' : 'en'
  if (page === 'home') return absoluteUrl(`/og/home-${assetLang}.png?v=${v}`)
  if (page === 'why') return absoluteUrl(`/og/why-${assetLang}.png?v=${v}`)
  if (page === 'tray') return absoluteUrl(`/og/tray-${assetLang}.png?v=${v}`)
  return absoluteUrl(`/og/default.png?v=${v}`)
}

export function buildPageMetadata(
  pageId: SeoPageId,
  lang: Locale,
): Metadata {
  const page = SEO_PAGES[pageId]
  const title = L(page.title, lang)
  const description = L(page.description, lang)
  const canonicalPath = localePath(lang, page.path)
  const canonical = absoluteUrl(canonicalPath)
  const og = ogImageUrl(pageId, lang)
  const index = page.index !== false

  const languages: Record<string, string> = {}
  for (const loc of LOCALES) {
    const hrefLang = loc === 'zh' ? 'zh-CN' : loc
    languages[hrefLang] = localePath(loc, page.path)
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
      locale: OG_LOCALE_TAG[lang],
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
    alternateName: [SITE.shortName, 'UMD WebHID', SITE.domain],
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Windows, Chrome, Edge',
    description: L(home.description, lang),
    url: getSiteUrl(),
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
      url: getSiteUrl(),
      sameAs: [...SITE.sameAs],
    },
    inLanguage: LOCALE_HTML_LANG[lang],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    alternateName: [SITE.shortName, SITE.domain],
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
