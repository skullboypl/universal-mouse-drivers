/**
 * Build per-model OpenMouse visuals:
 * 1) Prefer a single-mouse PNG with background removed (white-studio cutouts)
 * 2) Otherwise SVG: brand logo + generic mouse silhouette + model name
 *
 * Usage:
 *   node scripts/fetch-openmouse-product-images.mjs
 *   node scripts/fetch-openmouse-product-images.mjs --svg-only
 *   node scripts/fetch-openmouse-product-images.mjs --limit=10 --force
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const catalogPath = path.join(root, 'src/devices/openmouse/catalog.generated.ts')
const outDir = path.join(root, 'public/devices/openmouse/models')
const mapOut = path.join(root, 'src/devices/openmouse/productImages.generated.ts')
const manifestOut = path.join(root, 'public/devices/openmouse/models/SOURCES.json')

const VISUALS = {
  atk: { accent: '#ff4d4d', mark: 'AT' },
  corsair: { accent: '#ffd700', mark: 'CO' },
  fantech: { accent: '#e85d04', mark: 'FT' },
  finalmouse: { accent: '#f5f5f5', mark: 'FM' },
  'g-wolves': { accent: '#18a058', mark: 'GW' },
  glorious: { accent: '#c084fc', mark: 'GL' },
  'k-snake': { accent: '#22d3ee', mark: 'KS' },
  keychron: { accent: '#60a5fa', mark: 'KC' },
  lamzu: { accent: '#fb7185', mark: 'LZ' },
  mchose: { accent: '#a3e635', mark: 'MC' },
  microsoft: { accent: '#00a4ef', mark: 'MS' },
  ninjutso: { accent: '#f97316', mark: 'NJ' },
  pulsar: { accent: '#e11d48', mark: 'PU' },
  razer: { accent: '#44d62c', mark: 'RZ' },
  steelseries: { accent: '#ff6400', mark: 'SS' },
  teevolution: { accent: '#38bdf8', mark: 'TV' },
  vgn: { accent: '#fbbf24', mark: 'VG' },
  wallhack: { accent: '#e2e8f0', mark: 'WH' },
  wooting: { accent: '#ff5a36', mark: 'WO' },
  zaunkoenig: { accent: '#94a3b8', mark: 'ZK' },
}

const args = process.argv.slice(2)
const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || 0)
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1] || ''
const force = args.includes('--force')
const svgOnly = args.includes('--svg-only')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeVisualName(name) {
  return name
    .replace(/\s*\(Wired\)\s*/gi, '')
    .replace(/\s*\(wired mode\)\s*/gi, '')
    .replace(/\s*\(2\.4 GHz(?: wireless)? mode\)\s*/gi, '')
    .replace(/\s+Wireless receiver$/i, '')
    .replace(/\s+receiver$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function visualKey(brandSlug, name) {
  return `${brandSlug}::${normalizeVisualName(name).toLowerCase()}`
}

function isDongleOrDock(name) {
  return /dongle|dock|receiver/i.test(name)
}

function brandMeta(brandSlug) {
  return VISUALS[brandSlug] || { accent: '#0ea5e9', mark: 'OM' }
}

function searchQuery(brand, name) {
  const n = normalizeVisualName(name)
  if (isDongleOrDock(name)) {
    return `"${brand}" "${n}" product white background`
  }
  return `"${brand}" "${n}" mouse white background isolated -box -packaging -lifestyle -desk -hand`
}

async function bingImageCandidates(q) {
  const url =
    'https://www.bing.com/images/search?q=' +
    encodeURIComponent(q) +
    '&form=HDRSC2&first=1&qft=+filterui:photo-photo+filterui:aspect-square'
  const r = await fetch(url, {
    headers: {
      'user-agent': UA,
      'accept-language': 'en-US,en;q=0.9',
      accept: 'text/html',
    },
  })
  if (!r.ok) throw new Error(`bing ${r.status}`)
  const html = await r.text()
  const out = []
  for (const m of html.matchAll(/class="iusc"[^>]*\sm="([^"]+)"/g)) {
    try {
      const decoded = JSON.parse(
        m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      )
      if (decoded.murl) {
        out.push({
          image: decoded.murl,
          page: decoded.purl || '',
          title: decoded.t || '',
        })
      }
    } catch {
      /* skip */
    }
  }
  return out
}

function scoreCandidate(c, brand, name) {
  const u = c.image.toLowerCase()
  const t = `${c.title} ${c.page}`.toLowerCase()
  const n = normalizeVisualName(name).toLowerCase()
  const brandL = brand.toLowerCase()
  let score = 0
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(c.image)) score += 5
  if (/media-amazon|razerzone|steelseriescdn|shopify|cdn\.shopify|g-wolves|gloriousgaming/i.test(u))
    score += 8
  if (/white|isolated|cutout|png|transparent|studio|product/i.test(t)) score += 6
  if (/lifestyle|desk|hand|setup|review|unboxing|rgb room/i.test(t)) score -= 10
  if (/box|packaging|retail|package|carton|hang.?tab/i.test(t)) score -= 22
  if (/logo|icon|favicon|sprite|banner|svg/i.test(u + t)) score -= 12
  if (t.includes(brandL) || t.includes(brandL.replace(/-/g, ' '))) score += 10
  else score -= 8
  if (t.includes(n)) score += 14
  else {
    const tokens = n
      .split(/[\s/()+.-]+/)
      .filter((x) => x.length > 1 && !/^(the|and|edition|wireless|wired|mode)$/i.test(x))
    let hit = 0
    for (const tok of tokens) if (t.includes(tok)) hit++
    score += hit * 2
    if (hit < Math.min(2, tokens.length)) score -= 6
  }
  const wrong = [
    'endgame gear',
    'logitech',
    'corsair',
    'pulsar',
    'lamzu',
    'vaxee',
    'zowie',
    'benq',
    'asus',
    'roccat',
  ]
  for (const w of wrong) {
    if (!brandL.includes(w) && t.includes(w)) score -= 20
  }
  if (/aerox\s*5/i.test(n) && /aerox\s*9/i.test(t)) score -= 18
  if (/aerox\s*9/i.test(n) && /aerox\s*5/i.test(t) && !/aerox\s*9/i.test(t)) score -= 18
  return score
}

async function downloadBytes(url) {
  const r = await fetch(url, {
    headers: {
      'user-agent': UA,
      accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      referer: 'https://www.bing.com/',
    },
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`download ${r.status}`)
  const ctype = r.headers.get('content-type') || ''
  if (!/image\//i.test(ctype) && !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(url)) {
    throw new Error(`not image: ${ctype}`)
  }
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length < 4000) throw new Error(`too small ${buf.length}`)
  if (buf.length > 8_000_000) throw new Error(`too large ${buf.length}`)
  return buf
}

/** Corner mode: studio white, studio black, or reject. */
async function cornerStudioMode(buf) {
  const { data, info } = await sharp(buf)
    .resize(64, 64, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const samples = [
    [0, 0],
    [63, 0],
    [0, 63],
    [63, 63],
    [32, 0],
    [0, 32],
    [63, 32],
    [32, 63],
  ]
  let white = 0
  let black = 0
  for (const [x, y] of samples) {
    const i = (y * info.width + x) * 3
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (lum >= 232) white++
    if (lum <= 28) black++
  }
  if (white >= 6) return 'white'
  if (black >= 6) return 'black'
  return null
}

/**
 * Remove near-white or near-black studio backdrop → transparent PNG cutout.
 */
async function toCutoutPng(buf, mode) {
  const resized = await sharp(buf)
    .rotate()
    .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { data, info } = resized
  const w = info.width
  const h = info.height
  const px = data

  const dist = (i) => {
    const r = px[i]
    const g = px[i + 1]
    const b = px[i + 2]
    if (mode === 'white') {
      return Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
    }
    return Math.sqrt(r ** 2 + g ** 2 + b ** 2)
  }

  const HARD = mode === 'white' ? 28 : 22
  const SOFT = mode === 'white' ? 52 : 42
  let opaque = 0
  for (let i = 0; i < px.length; i += 4) {
    const d = dist(i)
    if (d <= HARD) {
      px[i + 3] = 0
    } else if (d < SOFT) {
      px[i + 3] = Math.round(((d - HARD) / (SOFT - HARD)) * 255)
      if (px[i + 3] > 32) opaque++
    } else {
      opaque++
    }
  }

  const total = w * h
  const opaqueRatio = opaque / total
  // Single mouse on studio: typically 12–55% opaque after trim-ish raw
  if (opaqueRatio < 0.1 || opaqueRatio > 0.62) {
    throw new Error(`cutout ratio ${opaqueRatio.toFixed(2)}`)
  }

  let out = await sharp(px, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer()

  out = await sharp(out)
    .trim({ threshold: 8 })
    .resize(720, 720, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer()

  // Reject leftover “full plate” (box / poster) — after contain, opaque should not fill most of canvas
  const check = await sharp(out)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let op = 0
  for (let i = 3; i < check.data.length; i += 4) {
    if (check.data[i] > 40) op++
  }
  const finalRatio = op / (check.info.width * check.info.height)
  if (finalRatio < 0.08 || finalRatio > 0.58) {
    throw new Error(`final ratio ${finalRatio.toFixed(2)}`)
  }

  return out
}

function writeModelSvg(job) {
  const meta = brandMeta(job.brandSlug)
  const accent = meta.accent
  const mark = meta.mark
  const logoPath = `/devices/openmouse/logos/${job.brandSlug}-icon.svg`
  const title = xmlEscape(job.brand)
  const model = xmlEscape(job.name)
  // Generic mouse silhouette (no filled card background — transparent)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 440" role="img" aria-label="${title} ${model}">
  <defs>
    <linearGradient id="body" x1="120" y1="40" x2="280" y2="320" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3a414c"/>
      <stop offset="1" stop-color="#15181e"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <image href="${logoPath}" x="18" y="18" width="64" height="64" preserveAspectRatio="xMidYMid meet"/>
  <text x="98" y="44" fill="#f3f4f6" font-family="Segoe UI,Arial,sans-serif" font-size="18" font-weight="700">${title}</text>
  <text x="98" y="72" fill="${accent}" font-family="Segoe UI,Arial,sans-serif" font-size="16" font-weight="650">${model}</text>
  <g filter="url(#soft)" transform="translate(48,86)">
    <path fill="url(#body)" stroke="${accent}" stroke-width="3"
      d="M152 18c54 0 98 44 98 108 0 78-42 148-98 176-56-28-98-98-98-176C54 62 98 18 152 18z"/>
    <path d="M152 42v78" stroke="#6b7280" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="152" cy="138" rx="18" ry="30" fill="#0f1218" stroke="${accent}" stroke-width="2.5"/>
    <path d="M78 120c-10 28-12 58-8 86" fill="none" stroke="#4b5563" stroke-width="10" stroke-linecap="round"/>
    <circle cx="152" cy="268" r="26" fill="${accent}"/>
    <text x="152" y="274" text-anchor="middle" fill="#0a0c10" font-family="Segoe UI,Arial Black,sans-serif" font-size="13" font-weight="800">${xmlEscape(mark)}</text>
  </g>
</svg>
`
  return svg
}

async function loadCatalogEntries() {
  const src = fs.readFileSync(catalogPath, 'utf8')
  const entries = []
  const re =
    /\{\s*id:\s*"([^"]+)",\s*brand:\s*"([^"]+)",\s*brandSlug:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)",[\s\S]*?hasProductName:\s*(true|false)/g
  let m
  while ((m = re.exec(src))) {
    entries.push({
      id: m[1],
      brand: m[2],
      brandSlug: m[3],
      slug: m[4],
      name: m[5],
      hasProductName: m[6] === 'true',
    })
  }
  return entries
}

async function main() {
  const entries = await loadCatalogEntries()
  const named = entries.filter((e) => e.hasProductName)
  const groups = new Map()
  for (const e of named) {
    if (only && e.brandSlug !== only) continue
    const key = visualKey(e.brandSlug, e.name)
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        brand: e.brand,
        brandSlug: e.brandSlug,
        name: normalizeVisualName(e.name),
        canonicalSlug: e.slug,
        slugs: [],
      })
    }
    groups.get(key).slugs.push(e.slug)
  }

  let jobs = [...groups.values()].sort((a, b) =>
    `${a.brand}${a.name}`.localeCompare(`${b.brand}${b.name}`),
  )
  if (limit > 0) jobs = jobs.slice(0, limit)

  console.log(
    `Jobs: ${jobs.length} visuals · mode=${svgOnly ? 'svg-only' : 'cutout+svg'}`,
  )
  fs.mkdirSync(outDir, { recursive: true })

  const fenrirSrc = path.join(root, 'public/devices/fenrir-max/mouse.png')
  const slugToFile = {}
  const sources = {}
  let pngOk = 0
  let svgOk = 0

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    const dir = path.join(outDir, job.brandSlug)
    fs.mkdirSync(dir, { recursive: true })
    const svgDest = path.join(dir, `${job.canonicalSlug}.svg`)
    const pngDest = path.join(dir, `${job.canonicalSlug}.png`)
    const svgRel = `/devices/openmouse/models/${job.brandSlug}/${job.canonicalSlug}.svg`
    const pngRel = `/devices/openmouse/models/${job.brandSlug}/${job.canonicalSlug}.png`

    // Always (re)write SVG fallback card
    fs.writeFileSync(svgDest, writeModelSvg(job), 'utf8')

    let used = svgRel
    let kind = 'svg'

    if (!svgOnly) {
      const canSkipPng =
        !force && fs.existsSync(pngDest) && fs.statSync(pngDest).size > 8000

      if (canSkipPng) {
        used = pngRel
        kind = 'png-reuse'
        pngOk++
        process.stdout.write(
          `[${i + 1}/${jobs.length}] REUSE-PNG ${job.brand} ${job.name}\n`,
        )
      } else {
        process.stdout.write(
          `[${i + 1}/${jobs.length}] ${job.brand} ${job.name} … `,
        )
        let savedPng = false
        let lastErr = ''

        // Prefer local Fenrir asset when applicable
        if (
          job.brandSlug === 'g-wolves' &&
          /fenrir|fenir/i.test(job.name) &&
          fs.existsSync(fenrirSrc)
        ) {
          try {
            const raw = fs.readFileSync(fenrirSrc)
            // Fenrir asset may already be cutout-ish; try remove white, else keep with trim
            let png
            try {
              png = await toCutoutPng(raw, 'white')
            } catch {
              try {
                png = await toCutoutPng(raw, 'black')
              } catch {
                png = await sharp(raw)
                  .resize(720, 720, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                  })
                  .png()
                  .toBuffer()
              }
            }
            fs.writeFileSync(pngDest, png)
            used = pngRel
            kind = 'png-local'
            savedPng = true
            pngOk++
            console.log(`PNG-local (${(png.length / 1024).toFixed(0)}KB)`)
          } catch (e) {
            lastErr = e.message || String(e)
          }
        }

        if (!savedPng) {
          try {
            const candidates = await bingImageCandidates(
              searchQuery(job.brand, job.name),
            )
            const ranked = candidates
              .map((c) => ({
                ...c,
                score: scoreCandidate(c, job.brand, job.name),
              }))
              .sort((a, b) => b.score - a.score)

            for (const c of ranked.slice(0, 14)) {
              if (c.score < 10) continue
              try {
                const raw = await downloadBytes(c.image)
                const mode = await cornerStudioMode(raw)
                if (!mode) {
                  lastErr = 'not studio bg'
                  continue
                }
                const png = await toCutoutPng(raw, mode)
                fs.writeFileSync(pngDest, png)
                used = pngRel
                kind = 'png-cutout'
                sources[pngRel] = {
                  brand: job.brand,
                  name: job.name,
                  imageUrl: c.image,
                  pageUrl: c.page,
                  title: c.title,
                  score: c.score,
                  cutout: true,
                }
                savedPng = true
                pngOk++
                console.log(
                  `PNG (${(png.length / 1024).toFixed(0)}KB) score=${c.score}`,
                )
                break
              } catch (e) {
                lastErr = e.message || String(e)
              }
            }
          } catch (e) {
            lastErr = e.message || String(e)
          }
        }

        if (!savedPng) {
          if (fs.existsSync(pngDest)) fs.unlinkSync(pngDest)
          svgOk++
          console.log(`SVG (${lastErr || 'no cutout'})`)
        }
        await sleep(650)
      }
    } else {
      if (fs.existsSync(pngDest)) {
        // keep existing png if present in svg-only mode
        used = pngRel
        kind = 'png-keep'
        pngOk++
      } else {
        svgOk++
      }
      if ((i + 1) % 25 === 0 || i === 0) {
        console.log(`[${i + 1}/${jobs.length}] SVG ${job.brand} ${job.name}`)
      }
    }

    for (const s of job.slugs) {
      slugToFile[`${job.brandSlug}/${s}`] = used
    }
    sources[svgRel] = {
      brand: job.brand,
      name: job.name,
      kind: 'svg-fallback',
    }
    if (kind.startsWith('png')) {
      sources[used] = {
        ...(sources[used] || {}),
        brand: job.brand,
        name: job.name,
        kind,
      }
    }
  }

  // Ensure every named slug maps (including when --only)
  for (const e of named) {
    const key = `${e.brandSlug}/${e.slug}`
    if (slugToFile[key]) continue
    const g = groups.get(visualKey(e.brandSlug, e.name))
    if (!g) continue
    const pngRel = `/devices/openmouse/models/${g.brandSlug}/${g.canonicalSlug}.png`
    const svgRel = `/devices/openmouse/models/${g.brandSlug}/${g.canonicalSlug}.svg`
    if (fs.existsSync(path.join(root, 'public', pngRel.slice(1)))) {
      slugToFile[key] = pngRel
    } else if (fs.existsSync(path.join(root, 'public', svgRel.slice(1)))) {
      slugToFile[key] = svgRel
    }
  }

  const ts = `/* eslint-disable */
/**
 * AUTO-GENERATED by scripts/fetch-openmouse-product-images.mjs — do not edit.
 * Maps brandSlug/slug -> cutout PNG (preferred) or SVG fallback.
 */
export const OPENMOUSE_PRODUCT_IMAGES: Record<string, string> = ${JSON.stringify(
    slugToFile,
    null,
    2,
  )}

export function openMouseProductImagePath(
  brandSlug: string,
  slug: string,
): string | undefined {
  return OPENMOUSE_PRODUCT_IMAGES[\`\${brandSlug}/\${slug}\`]
}
`
  fs.writeFileSync(mapOut, ts)
  fs.writeFileSync(manifestOut, JSON.stringify(sources, null, 2))
  console.log(`\nDone png=${pngOk} svg=${svgOk} mapped=${Object.keys(slugToFile).length}`)
  console.log(`Wrote ${mapOut}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
