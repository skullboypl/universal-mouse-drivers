import { NextResponse, type NextRequest } from 'next/server'

/** Expose locale from /{pl|en}/… so root <html lang> can match the page. */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const seg = request.nextUrl.pathname.split('/')[1]
  if (seg === 'pl' || seg === 'en') {
    requestHeaders.set('x-umd-locale', seg)
  }
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|og|favicon|.*\\..*).*)'],
}
