import { ImageResponse } from 'next/og'
import { SEO_PAGES } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { isLocale, type Locale } from '@/i18n/locale'

/** Build-time / Node OG for /{lang} — Discord-friendly (no query string). */
export const runtime = 'nodejs'
export const alt = 'Universal Mouse Drivers'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang: Locale = isLocale(raw) ? raw : 'pl'
  const page = SEO_PAGES.home
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
            'linear-gradient(145deg, #0a0c10 0%, #12161d 50%, #1a140c 100%)',
          color: '#eef1f5',
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
                background: 'linear-gradient(135deg, #e8a23a 0%, #f0b45a 100%)',
                color: '#0a0c10',
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
              <div style={{ fontSize: 16, color: '#8b95a5' }}>{SITE.name}</div>
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              color: '#c5d0e0',
              border: '1px solid rgba(232,162,58,0.35)',
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
              fontSize: 52,
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
              fontSize: 22,
              lineHeight: 1.35,
              color: '#8b95a5',
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
            color: '#5c6675',
            fontSize: 18,
          }}
        >
          <div>WebHID · King Ultra · Fenrir Max · {lang.toUpperCase()}</div>
          <div>mouse.vxh.pl</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
