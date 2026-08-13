import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES } from '@/i18n/locale'
import { isLocale, type Locale } from '@/i18n/locale'
import { buildPageMetadata } from '@/lib/seo'
import { TraySeoView } from '@/views/SeoArticleViews'

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  return buildPageMetadata('tray', lang as Locale)
}

export default async function TrayPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return <TraySeoView lang={lang as Locale} />
}
