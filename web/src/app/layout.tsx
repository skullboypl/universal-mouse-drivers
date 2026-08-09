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
  openGraph: {
    title: 'UMD - Universal Mouse Drivers',
    description:
      'Browser-native HID control + Windows tray battery for supported mice.',
    type: 'website',
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
