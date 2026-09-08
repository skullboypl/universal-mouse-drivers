import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { JsonLd } from '@/components/JsonLd'
import { Shell } from '@/components/Shell'
import { LocaleProvider } from '@/i18n/LocaleContext'
import { isLocale, LOCALES, type Locale } from '@/i18n/locale'
import {
  softwareApplicationJsonLd,
  websiteJsonLd,
} from '@/lib/seo'
import { DeviceSessionProvider } from '@/session/DeviceSessionContext'

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang as Locale

  return (
    <DeviceSessionProvider>
      <LocaleProvider locale={locale}>
        <JsonLd data={websiteJsonLd()} />
        <JsonLd data={softwareApplicationJsonLd(locale)} />
        <Shell>{children}</Shell>
      </LocaleProvider>
    </DeviceSessionProvider>
  )
}
