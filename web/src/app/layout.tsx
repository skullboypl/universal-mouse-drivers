import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://umd.skullmedia.pl',
  ),
  title: {
    default: 'UMD - Universal Mouse Drivers',
    template: '%s · UMD',
  },
  description:
    'WebHID drivers and battery tray for gaming mice - Redragon King Ultra and more.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/umd-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'UMD - Universal Mouse Drivers',
    description:
      'Browser-native HID control + Windows tray battery for supported mice.',
    type: 'website',
    images: [{ url: '/brand/umd-logo.png', width: 1024, height: 1024, alt: 'UMD' }],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
