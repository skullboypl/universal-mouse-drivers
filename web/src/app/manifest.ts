import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description:
      'Browser-native WebHID drivers and battery tray for gaming mice.',
    start_url: '/pl',
    display: 'standalone',
    background_color: '#0b1220',
    theme_color: '#0b1220',
    lang: 'pl',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
        purpose: 'any',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
