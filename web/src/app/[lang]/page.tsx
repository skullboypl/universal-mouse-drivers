import type { Metadata } from 'next'
import { ConnectPage } from '@/views/ConnectPage'
import { isLocale } from '@/i18n/locale'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const pl = lang === 'pl'
  return {
    title: pl
      ? 'Połącz mysz - Universal Mouse Drivers'
      : 'Connect mouse - Universal Mouse Drivers',
    description: pl
      ? 'Sterowniki WebHID w przeglądarce i tray baterii dla King Ultra.'
      : 'Browser WebHID drivers and battery tray for King Ultra.',
    alternates: {
      languages: { pl: '/pl', en: '/en' },
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) return null
  return <ConnectPage />
}
