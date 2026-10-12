import type { Metadata } from 'next'
import { DeviceCalibrationPage } from '@/views/DevicePages'
import { isLocale, type Locale } from '@/i18n/locale'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  return buildPageMetadata('settings', lang as Locale)
}

export default function Page() {
  return <DeviceCalibrationPage />
}
