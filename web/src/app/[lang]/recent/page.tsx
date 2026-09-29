import type { Metadata } from 'next'
import { RecentDevicesPage } from '@/views/RecentDevicesPage'
import { isLocale, type Locale } from '@/i18n/locale'
import { absoluteUrl, localePath, localizedAlternates } from '@/lib/seo'
import { L } from '@/lib/l10n'

const TITLE = {
  pl: 'Ostatnie urządzenia | UMD',
  en: 'Recent devices | UMD',
  de: 'Zuletzt verwendet | UMD',
  fr: 'Appareils récents | UMD',
  es: 'Dispositivos recientes | UMD',
  pt: 'Dispositivos recentes | UMD',
  it: 'Dispositivi recenti | UMD',
  zh: '最近设备 | UMD',
  ja: '最近のデバイス | UMD',
  ko: '최근 장치 | UMD',
  ru: 'Недавние устройства | UMD',
}

const DESCRIPTION = {
  pl: 'Myszy ostatnio łączone w Universal Mouse Drivers na tym komputerze - kliknij, żeby otworzyć ponownie przez WebHID.',
  en: 'Mice previously connected in Universal Mouse Drivers on this computer - click to reopen over WebHID.',
  de: 'Zuletzt in Universal Mouse Drivers verbundene Mäuse auf diesem Computer - per WebHID erneut öffnen.',
  fr: 'Souris déjà connectées dans Universal Mouse Drivers sur cet ordinateur - rouvrir via WebHID.',
  es: 'Ratones conectados antes en Universal Mouse Drivers en este equipo - vuelve a abrirlos por WebHID.',
  pt: 'Ratos ligados anteriormente no Universal Mouse Drivers neste computador - reabra via WebHID.',
  it: 'Mouse già collegati in Universal Mouse Drivers su questo computer - riapri via WebHID.',
  zh: '本机此前在 Universal Mouse Drivers 中连接过的鼠标 — 通过 WebHID 再次打开。',
  ja: 'このパソコンで Universal Mouse Drivers に接続したマウス — WebHID で再度開きます。',
  ko: '이 컴퓨터에서 Universal Mouse Drivers에 연결했던 마우스 — WebHID로 다시 엽니다.',
  ru: 'Мыши, ранее подключённые в Universal Mouse Drivers на этом компьютере — снова открыть через WebHID.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const path = '/recent'
  return {
    title: L(TITLE, lang as Locale),
    description: L(DESCRIPTION, lang as Locale),
    alternates: {
      canonical: absoluteUrl(localePath(lang as Locale, path)),
      languages: localizedAlternates(path),
    },
    robots: { index: false, follow: true },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) return null
  return <RecentDevicesPage />
}
