import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  isLocale,
  localeFromAcceptLanguage,
  localeFromCountryCode,
  LOCALE_STORAGE_KEY,
  type Locale,
} from '@/i18n/locale'

async function localeFromIp(ip: string | null): Promise<Locale | null> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return null
  try {
    const res = await fetch(
      `https://ipapi.co/${encodeURIComponent(ip)}/country_code/`,
      {
        signal: AbortSignal.timeout(2000),
        next: { revalidate: 86400 },
      },
    )
    if (!res.ok) return null
    const code = (await res.text()).trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(code)) return null
    return localeFromCountryCode(code) ?? 'en'
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Cookie → CF/Vercel country → IP country → Accept-Language.
 * Unknown countries fall back to English.
 */
async function detectLocale(): Promise<Locale> {
  const jar = await cookies()
  const stored = jar.get(LOCALE_STORAGE_KEY)?.value
  if (isLocale(stored)) return stored

  const h = await headers()
  const country = (
    h.get('cf-ipcountry') ||
    h.get('x-vercel-ip-country') ||
    h.get('x-country-code') ||
    ''
  ).toUpperCase()
  const fromCountry = localeFromCountryCode(country)
  if (fromCountry) return fromCountry
  if (country && country !== 'XX' && country !== 'T1') return 'en'

  const fwd = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const fromIp = await localeFromIp(fwd)
  if (fromIp) return fromIp

  return localeFromAcceptLanguage(h.get('accept-language'))
}

export default async function RootPage() {
  const locale = await detectLocale()
  redirect(`/${locale}`)
}
