import { NextResponse, type NextRequest } from 'next/server'
import {
  isLocale,
  localeFromAcceptLanguage,
  localeFromCountryCode,
  LOCALE_STORAGE_KEY,
  type Locale,
} from '@/i18n/locale'
import { getSiteUrl, isLegacyHost } from '@/lib/site'

/**
 * - Locale → `x-umd-locale` for root <html lang>
 * - Paths without `/{lang}/…` → 301 to preferred locale (cookie / country / Accept-Language)
 * - Legacy hosts (mouse.vxh.pl, …): keep /api/* on this app for old tray
 *   auto-update; 301 everything else to canonical umdrivers.com
 *
 * CapRover must point legacy domains at THIS app (alias), not a separate
 * HTTP→HTTP redirect app - .NET HttpClient refuses HTTPS→HTTP 302s.
 */

const RESERVED_ROOT = new Set(['api', 'admin', '_next', 'og'])

function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_STORAGE_KEY)?.value
  if (isLocale(cookie)) return cookie

  const country = (
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-country-code') ||
    ''
  ).toUpperCase()
  const fromCountry = localeFromCountryCode(country)
  if (fromCountry) return fromCountry
  if (country && country !== 'XX' && country !== 'T1') return 'en'

  return localeFromAcceptLanguage(request.headers.get('accept-language'))
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')
  const { pathname, search } = request.nextUrl

  if (isLegacyHost(host)) {
    const isTrayApi =
      pathname === '/api/tray/latest' ||
      pathname.startsWith('/api/tray/') ||
      pathname.startsWith('/api/downloads/')

    if (!isTrayApi) {
      const dest = new URL(`${pathname}${search}`, `${getSiteUrl()}/`)
      return NextResponse.redirect(dest, 301)
    }

    // Tray API stays on legacy host so old EXE can fetch without redirects.
    return NextResponse.next()
  }

  const seg = pathname.split('/')[1] || ''

  // `/` stays on app/page.tsx (IP + cookie locale detect).
  if (!seg) {
    return NextResponse.next()
  }

  if (isLocale(seg)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-umd-locale', seg)
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  if (RESERVED_ROOT.has(seg)) {
    return NextResponse.next()
  }

  // e.g. /mice/openmouse → /en/mice/openmouse (or cookie/country locale)
  const locale = preferredLocale(request)
  const dest = request.nextUrl.clone()
  dest.pathname = `/${locale}${pathname}`.replace(/\/{2,}/g, '/')
  return NextResponse.redirect(dest, 301)
}

export const config = {
  // Include /api so legacy-host routing can short-circuit tray endpoints.
  matcher: ['/((?!_next/static|_next/image|og|favicon|.*\\..*).*)'],
}
