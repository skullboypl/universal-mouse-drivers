/** Canonical production origin (no trailing slash). */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://mouse.vxh.pl'
  return raw.replace(/\/$/, '')
}

export const SITE = {
  shortName: 'UMD',
  name: 'Universal Mouse Drivers',
  defaultLocale: 'pl' as const,
  locales: ['pl', 'en'] as const,
  twitterHandle: '@skullboypl',
  sameAs: [
    'https://www.tiktok.com/@skullboypl',
    'https://github.com/skullboypl',
    'https://github.com/skullboypl/universal-mouse-drivers',
    'https://github.com/skullboypl/udm-universal-mouse-drivers',
  ],
} as const
