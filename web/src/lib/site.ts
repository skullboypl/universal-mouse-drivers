/** Canonical production origin (no trailing slash). */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://umdrivers.com'
  return raw.replace(/\/$/, '')
}

export const SITE = {
  shortName: 'UMD',
  name: 'Universal Mouse Drivers',
  /** Primary public hostname (SEO / AEO / GEO). */
  domain: 'umdrivers.com',
  defaultLocale: 'pl' as const,
  locales: [
    'pl',
    'en',
    'de',
    'fr',
    'es',
    'pt',
    'it',
    'zh',
    'ja',
    'ko',
    'ru',
  ] as const,
  twitterHandle: '@skullboypl',
  sameAs: [
    'https://www.tiktok.com/@skullboypl',
    'https://github.com/skullboypl',
    'https://github.com/skullboypl/universal-mouse-drivers',
    'https://github.com/skullboypl/udm-universal-mouse-drivers',
    'https://umdrivers.com',
  ],
} as const
