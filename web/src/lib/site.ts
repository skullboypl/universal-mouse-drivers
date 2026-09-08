/** Canonical production origin (no trailing slash). */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://umdrivers.com'
  return raw.replace(/\/$/, '')
}

/** Hostnames that old tray builds / bookmarks still use. */
export const LEGACY_HOSTS = [
  'mouse.vxh.pl',
  'www.mouse.vxh.pl',
  'umd.skullmedia.pl',
  'www.umd.skullmedia.pl',
] as const

export function hostnameOf(hostHeader: string | null | undefined): string {
  if (!hostHeader) return ''
  return hostHeader.split(':')[0]?.trim().toLowerCase() ?? ''
}

export function isLegacyHost(hostHeader: string | null | undefined): boolean {
  const host = hostnameOf(hostHeader)
  return (LEGACY_HOSTS as readonly string[]).includes(host)
}

/**
 * Absolute URL for tray auto-update downloads.
 * Always canonical HTTPS site — never inherit a legacy Host — so old
 * HttpClient clients never get http:// or a dying hostname in `url`.
 */
export function getTrayDownloadBaseUrl(): string {
  return getSiteUrl()
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
    'https://github.com/OpenMouse-Project',
    'https://github.com/OpenMouse-Project/openmouse',
    'https://github.com/OpenMouse-Project/mouse-protocol',
    'https://umdrivers.com',
  ],
} as const
