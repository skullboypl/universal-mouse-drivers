import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES } from '@/i18n/locale'
import { isLocale, type Locale } from '@/i18n/locale'
import { buildPageMetadata } from '@/lib/seo'
import { WhySeoView } from '@/views/SeoArticleViews'

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
  return buildPageMetadata('why', lang as Locale)
}

export default async function WhyPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return <WhySeoView lang={lang as Locale} />
}
