import type { Metadata } from 'next'
import { NativeMicePage } from '@/views/NativeMicePage'
import { isLocale, type Locale } from '@/i18n/locale'
import { absoluteUrl, localePath, localizedAlternates } from '@/lib/seo'
import { L } from '@/lib/l10n'

const TITLE = {
  pl: 'Myszy native UMD | Universal Mouse Drivers',
  en: 'UMD native mice | Universal Mouse Drivers',
  de: 'UMD-native Mäuse | Universal Mouse Drivers',
  fr: 'Souris natives UMD | Universal Mouse Drivers',
  es: 'Ratones nativos UMD | Universal Mouse Drivers',
  pt: 'Ratos nativos UMD | Universal Mouse Drivers',
  it: 'Mouse nativi UMD | Universal Mouse Drivers',
  zh: 'UMD 原生鼠标 | Universal Mouse Drivers',
  ja: 'UMD ネイティブマウス | Universal Mouse Drivers',
  ko: 'UMD 네이티브 마우스 | Universal Mouse Drivers',
  ru: 'Нативные мыши UMD | Universal Mouse Drivers',
}

const DESCRIPTION = {
  pl: 'Pełne sterowniki WebHID UMD: Redragon King Ultra, Rampage Blitz Ultimate, G-Wolves Fenrir Max, Logitech PRO X SUPERLIGHT i PRO X3 SUPERSTRIKE.',
  en: 'Full UMD WebHID drivers: Redragon King Ultra, Rampage Blitz Ultimate, G-Wolves Fenrir Max, Logitech PRO X SUPERLIGHT and PRO X3 SUPERSTRIKE.',
  de: 'Volle UMD-WebHID-Treiber: Redragon King Ultra, Rampage Blitz Ultimate, G-Wolves Fenrir Max, Logitech PRO X SUPERLIGHT und PRO X3 SUPERSTRIKE.',
  fr: 'Pilotes WebHID UMD complets : Redragon King Ultra, Rampage Blitz Ultimate, G-Wolves Fenrir Max, Logitech PRO X SUPERLIGHT et PRO X3 SUPERSTRIKE.',
  es: 'Drivers WebHID UMD completos: Redragon King Ultra, Rampage Blitz Ultimate, G-Wolves Fenrir Max, Logitech PRO X SUPERLIGHT y PRO X3 SUPERSTRIKE.',
  pt: 'Drivers WebHID UMD completos: Redragon King Ultra, Rampage Blitz Ultimate, G-Wolves Fenrir Max, Logitech PRO X SUPERLIGHT e PRO X3 SUPERSTRIKE.',
  it: 'Driver WebHID UMD completi: Redragon King Ultra, Rampage Blitz Ultimate, G-Wolves Fenrir Max, Logitech PRO X SUPERLIGHT e PRO X3 SUPERSTRIKE.',
  zh: '完整 UMD WebHID 驱动：Redragon King Ultra、Rampage Blitz Ultimate、G-Wolves Fenrir Max、Logitech PRO X SUPERLIGHT 与 PRO X3 SUPERSTRIKE。',
  ja: 'UMD のフル WebHID ドライバー：Redragon King Ultra、Rampage Blitz Ultimate、G-Wolves Fenrir Max、Logitech PRO X SUPERLIGHT、PRO X3 SUPERSTRIKE。',
  ko: '전체 UMD WebHID 드라이버: Redragon King Ultra, Rampage Blitz Ultimate, G-Wolves Fenrir Max, Logitech PRO X SUPERLIGHT 및 PRO X3 SUPERSTRIKE.',
  ru: 'Полные WebHID-драйверы UMD: Redragon King Ultra, Rampage Blitz Ultimate, G-Wolves Fenrir Max, Logitech PRO X SUPERLIGHT и PRO X3 SUPERSTRIKE.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const path = '/mice'
  return {
    title: L(TITLE, lang as Locale),
    description: L(DESCRIPTION, lang as Locale),
    alternates: {
      canonical: absoluteUrl(localePath(lang as Locale, path)),
      languages: localizedAlternates(path),
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
  return <NativeMicePage />
}
