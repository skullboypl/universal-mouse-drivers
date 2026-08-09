import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { SITE, getSiteUrl } from '@/lib/site'
import { ogImageUrl } from '@/lib/seo'
import './globals.css'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.shortName} — ${SITE.name}`,
    template: `%s · ${SITE.shortName}`,
  },
  description:
    'WebHID drivers and battery tray for gaming mice — Redragon King Ultra and more.',
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
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: `${SITE.shortName} — ${SITE.name}`,
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
    title: `${SITE.shortName} — ${SITE.name}`,
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
    languages: {
      pl: '/pl',
      en: '/en',
      'x-default': '/en',
    },
  },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const h = await headers()
  const lang = h.get('x-umd-locale') === 'en' ? 'en' : 'pl'
  return (
    <html lang={lang} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
