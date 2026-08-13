import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { NextRequest } from 'next/server'
import { SEO_PAGES, type SeoPageId } from '@/lib/seo'
import { isLocale, type Locale } from '@/i18n/locale'

/**
 * CapRover/Alpine: next/og (Satori) often 502s on GET.
 * Serve pre-baked PNGs from /public/og instead.
 */
export const runtime = 'nodejs'

function isPageId(v: string | null): v is SeoPageId {
  return !!v && v in SEO_PAGES
}

function fileFor(page: SeoPageId, lang: Locale): string {
  // Only pl/en OG assets are baked; other locales reuse English art.
  const assetLang = lang === 'pl' ? 'pl' : 'en'
  if (page === 'home') return `home-${assetLang}.png`
  if (page === 'why') return `why-${assetLang}.png`
  if (page === 'tray') return `tray-${assetLang}.png`
  return 'default.png'
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const pageId = isPageId(searchParams.get('page'))
    ? (searchParams.get('page') as SeoPageId)
    : 'home'
  const rawLang = searchParams.get('lang')
  const lang: Locale = isLocale(rawLang) ? rawLang : 'en'

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
