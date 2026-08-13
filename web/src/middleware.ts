import { NextResponse, type NextRequest } from 'next/server'
import { isLocale } from '@/i18n/locale'

/** Expose locale from /{locale}/… so root <html lang> can match the page. */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const seg = request.nextUrl.pathname.split('/')[1]
  if (isLocale(seg)) {
    requestHeaders.set('x-umd-locale', seg)
  }
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|og|favicon|.*\\..*).*)'],
}
