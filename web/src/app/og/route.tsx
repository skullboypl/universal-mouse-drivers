import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { NextRequest } from 'next/server'
import { SEO_PAGES, type SeoPageId } from '@/lib/seo'
import type { Locale } from '@/i18n/locale'

/**
 * CapRover/Alpine: next/og (Satori) often 502s on GET.
 * Serve pre-baked PNGs from /public/og instead.
 */
export const runtime = 'nodejs'

function isPageId(v: string | null): v is SeoPageId {
  return !!v && v in SEO_PAGES
}

function isLocale(v: string | null): v is Locale {
  return v === 'pl' || v === 'en'
}

function fileFor(page: SeoPageId, lang: Locale): string {
  if (page === 'home') return `home-${lang}.png`
  if (page === 'why') return `why-${lang}.png`
  if (page === 'tray') return `tray-${lang}.png`
  return 'default.png'
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const pageId = isPageId(searchParams.get('page'))
    ? (searchParams.get('page') as SeoPageId)
    : 'home'
  const lang = isLocale(searchParams.get('lang'))
    ? (searchParams.get('lang') as Locale)
    : 'en'

  const file = fileFor(pageId, lang)
  const buf = await readFile(path.join(process.cwd(), 'public', 'og', file))

  return new Response(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(buf.byteLength),
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
