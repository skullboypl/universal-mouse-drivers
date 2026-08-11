import type { Metadata } from 'next'
import { ConnectPage } from '@/views/ConnectPage'
import { JsonLd } from '@/components/JsonLd'
import { isLocale, type Locale } from '@/i18n/locale'
import { buildPageMetadata } from '@/lib/seo'
import { faqJsonLd } from '@/lib/seoContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  return buildPageMetadata('home', lang as Locale)
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) return null
  return (
    <>
      <JsonLd data={faqJsonLd(lang as Locale)} />
      <ConnectPage />
    </>
  )
}
