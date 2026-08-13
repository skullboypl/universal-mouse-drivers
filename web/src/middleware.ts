import { NextResponse, type NextRequest } from 'next/server'
import { isLocale } from '@/i18n/locale'
import { getSiteUrl, isLegacyHost } from '@/lib/site'

/**
 * - Locale → `x-umd-locale` for root <html lang>
 * - Legacy hosts (mouse.vxh.pl, …): keep /api/* on this app for old tray
 *   auto-update; 301 everything else to canonical umdrivers.com
 *
 * CapRover must point legacy domains at THIS app (alias), not a separate
 * HTTP→HTTP redirect app — .NET HttpClient refuses HTTPS→HTTP 302s.
 */
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

  const requestHeaders = new Headers(request.headers)
  const seg = pathname.split('/')[1]
  if (isLocale(seg)) {
    requestHeaders.set('x-umd-locale', seg)
  }
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  // Include /api so legacy-host routing can short-circuit tray endpoints.
  matcher: ['/((?!_next/static|_next/image|og|favicon|.*\\..*).*)'],
}
