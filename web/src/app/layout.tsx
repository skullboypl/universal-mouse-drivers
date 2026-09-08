import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import {
  isLocale,
  LOCALE_HTML_LANG,
  LOCALES,
  type Locale,
} from '@/i18n/locale'
import { SITE, getSiteUrl } from '@/lib/site'
import { ogImageUrl } from '@/lib/seo'
import './globals.css'

const siteUrl = getSiteUrl()

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0c10',
}

const languageAlternates = Object.fromEntries([
  ...LOCALES.map((l) => [l === 'zh' ? 'zh-CN' : l, `/${l}`] as const),
  ['x-default', '/en'] as const,
])

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.shortName} - ${SITE.name}`,
    template: `%s · ${SITE.shortName}`,
  },
  description:
    'WebHID drivers and battery tray for gaming mice - Redragon King Ultra and more.',
  applicationName: SITE.name,
  authors: [{ name: 'SkullMedia', url: siteUrl }],
  creator: 'SkullMedia',
  publisher: 'SkullMedia',
  category: 'technology',
  keywords: [
    'UMD',
    'Universal Mouse Drivers',
    'WebHID',
    'Redragon King Ultra',
    'M916OB-ULT',
    'mouse firmware',
    'DPI',
    'gaming mouse software',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: `${SITE.shortName} - ${SITE.name}`,
    description:
      'Browser-native HID control + Windows tray battery for supported mice.',
    type: 'website',
    siteName: SITE.name,
    url: siteUrl,
    images: [
      {
        url: ogImageUrl('home', 'en'),
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: SITE.twitterHandle,
    title: `${SITE.shortName} - ${SITE.name}`,
    description:
      'Browser-native HID control + Windows tray battery for supported mice.',
    images: [ogImageUrl('home', 'en')],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    languages: languageAlternates,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const h = await headers()
  const raw = h.get('x-umd-locale')
  const locale: Locale = isLocale(raw) ? raw : 'pl'
  return (
    <html lang={LOCALE_HTML_LANG[locale]} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
