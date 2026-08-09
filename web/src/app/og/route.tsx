import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { SEO_PAGES, type SeoPageId } from '@/lib/seo'
import { SITE } from '@/lib/site'
import type { Locale } from '@/i18n/locale'

export const runtime = 'edge'

const SIZE = { width: 1200, height: 630 }

function isPageId(v: string | null): v is SeoPageId {
  return !!v && v in SEO_PAGES
}

function isLocale(v: string | null): v is Locale {
  return v === 'pl' || v === 'en'
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const pageId = isPageId(searchParams.get('page'))
    ? (searchParams.get('page') as SeoPageId)
    : 'home'
  const lang = isLocale(searchParams.get('lang'))
    ? (searchParams.get('lang') as Locale)
    : 'en'

  const page = SEO_PAGES[pageId]
  const title = page.title[lang]
  const description = page.description[lang]
  const eyebrow = page.eyebrow[lang]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background:
            'linear-gradient(145deg, #0b1220 0%, #121a2b 45%, #1a1020 100%)',
          color: '#f2f4f8',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #e8ff4d 0%, #7dffb3 100%)',
                color: '#0b1220',
                fontSize: 22,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: -1,
              }}
            >
              UMD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
                {SITE.shortName}
              </div>
              <div style={{ fontSize: 16, color: '#9aa6b8' }}>{SITE.name}</div>
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              color: '#c5d0e0',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 999,
              padding: '8px 18px',
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1.4,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.35,
              color: '#b7c3d6',
              maxWidth: 920,
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#8a97ab',
            fontSize: 18,
          }}
        >
          <div>WebHID · King Ultra · {lang.toUpperCase()}</div>
          <div>mouse.vxh.pl</div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    },
  )
}
