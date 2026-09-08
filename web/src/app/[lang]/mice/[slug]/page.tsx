import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, isLocale, type Locale } from '@/i18n/locale'
import { buildPageMetadata, seoPageIdForMouseSlug } from '@/lib/seo'
import {
  DEVICE_SEO_ARTICLES,
  getDeviceIdentityForSeo,
  getDeviceSeo,
} from '@/lib/seoContent'
import { DeviceSeoView } from '@/views/SeoArticleViews'

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    DEVICE_SEO_ARTICLES.map((a) => ({ lang, slug: a.slug })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLocale(lang)) return {}
  const pageId = seoPageIdForMouseSlug(slug)
  if (!pageId) return {}
  return buildPageMetadata(pageId, lang as Locale)
}

export default async function MouseSeoPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  if (!isLocale(lang)) notFound()
  const article = getDeviceSeo(slug)
  if (!article) notFound()
  const identity = getDeviceIdentityForSeo(article)
  return (
    <DeviceSeoView
      lang={lang as Locale}
      article={article}
      imageUrl={identity.imageUrl}
    />
  )
}
