/**
 * Save brand logos as real PNG/ICO files (SVG-with-embedded-image
 * does NOT render inside <img src="*.svg"> in browsers).
 * Razer/SteelSeries/Corsair stay as flat SVG paths.
 */
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logosDir = path.join(__dirname, '../public/devices/openmouse/logos')

function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    lib
      .get(url, { headers: { 'User-Agent': 'UMD-logo-fetch/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location).then(resolve, reject)
          return
        }
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () =>
          resolve({
            buf: Buffer.concat(chunks),
            type: res.headers['content-type'] || '',
            status: res.statusCode || 0,
          }),
        )
        res.on('error', reject)
      })
      .on('error', reject)
  })
}

function wrapSi(accent, pathD, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${label}">
  <rect width="128" height="128" rx="28" fill="${accent}"/>
  <g transform="translate(28,28) scale(3)">
    <path fill="#fff" d="${pathD}"/>
  </g>
</svg>
`
}

function wrapWord(accent, ink, lines, label) {
  const longest = Math.max(...lines.map((l) => l.length))
  const fontSize =
    lines.length === 1
      ? longest <= 3
        ? 42
        : longest <= 5
          ? 32
          : 22
      : longest <= 5
        ? 26
        : 18
  const lineH = fontSize * 1.12
  const startY = 64 - ((lines.length - 1) * lineH) / 2
  const texts = lines
    .map(
      (t, i) =>
        `  <text x="64" y="${(startY + i * lineH).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${ink}" font-family="Segoe UI,Arial Black,Arial,sans-serif" font-size="${fontSize}" font-weight="800">${t}</text>`,
    )
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${label}">
  <rect width="128" height="128" rx="28" fill="${accent}"/>
${texts}
</svg>
`
}

const SI = {
  razer: { accent: '#44d62c', label: 'Razer' },
  steelseries: { accent: '#ff6400', label: 'SteelSeries' },
  corsair: { accent: '#111111', label: 'Corsair' },
}

const FAVICON = {
  glorious: { hosts: ['gloriousgaming.com'], min: 400 },
  ninjutso: { hosts: ['ninjutso.com'], min: 400 },
  atk: { hosts: ['www.atk.store', 'atk.store'], min: 800 },
  pulsar: { hosts: ['www.pulsar.gg', 'pulsar.gg'], min: 400 },
  teevolution: { hosts: ['www.teevolution.com'], min: 400 },
  wallhack: { hosts: ['wallhack.com'], min: 400 },
  lamzu: { hosts: ['www.lamzu.com'], min: 200, ddg: 'www.lamzu.com' },
  fantech: { hosts: ['fantechworld.com'], min: 400 },
  keychron: { hosts: ['www.keychron.com'], min: 400 },
  wooting: { hosts: ['wooting.io'], min: 400 },
  vgn: { hosts: ['vgnlab.com'], min: 400 },
}

const WORD = {
  'g-wolves': ['#18a058', '#fff', ['G', 'WOLVES']],
  'k-snake': ['#22d3ee', '#0c2228', ['K', 'SNAKE']],
  finalmouse: ['#f5f5f5', '#111', ['FINAL', 'MOUSE']],
  mchose: ['#a3e635', '#1a2410', ['MCHOSE']],
  zaunkoenig: ['#94a3b8', '#0f172a', ['ZAUN']],
  microsoft: null, // keep existing 4-square
}

const pngSlugs = []

for (const [slug, meta] of Object.entries(SI)) {
  const { buf } = await get(
    `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${slug}.svg`,
  )
  const m = buf.toString('utf8').match(/d="([^"]+)"/)
  fs.writeFileSync(path.join(logosDir, `${slug}-icon.svg`), wrapSi(meta.accent, m[1], meta.label))
  // remove stale png if any
  const png = path.join(logosDir, `${slug}-icon.png`)
  if (fs.existsSync(png)) fs.unlinkSync(png)
  console.log('SI svg', slug)
}

for (const [slug, meta] of Object.entries(FAVICON)) {
  let best = null
  for (const host of meta.hosts) {
    const url = `https://www.google.com/s2/favicons?domain=${host}&sz=128`
    try {
      const { buf, status } = await get(url)
      if (status !== 200 || buf.length < meta.min) continue
      if (buf[0] !== 0x89 && buf[0] !== 0xff && buf[0] !== 0x00 && buf[0] !== 0x47) continue
      if (!best || buf.length > best.length) best = buf
    } catch {
      /* ignore */
    }
  }
  if (!best && meta.ddg) {
    try {
      const { buf, status } = await get(`https://icons.duckduckgo.com/ip3/${meta.ddg}.ico`)
      if (status === 200 && buf.length >= 400) best = buf
    } catch {
      /* ignore */
    }
  }
  if (best) {
    // Prefer .png extension even for ico — browsers sniff magic bytes
    const isPng = best[0] === 0x89
    const ext = isPng ? 'png' : 'png'
    // If ICO, still save as .png name but keep bytes — better convert? Keep as .ico file
    const outExt = isPng ? 'png' : best[0] === 0xff ? 'jpg' : 'ico'
    const outName = `${slug}-icon.${outExt === 'jpg' ? 'png' : outExt}`
    // Always write png/ico next to svg; delete wordmark-only svg image embeds
    fs.writeFileSync(path.join(logosDir, `${slug}-icon.${outExt}`), best)
    // Also keep a simple colored SVG fallback without embed
    const accent =
      {
        glorious: '#c084fc',
        ninjutso: '#f97316',
        atk: '#ff4d4d',
        pulsar: '#e11d48',
        teevolution: '#38bdf8',
        wallhack: '#1a1f28',
        lamzu: '#fb7185',
        fantech: '#e85d04',
        keychron: '#60a5fa',
        wooting: '#ff5a36',
        vgn: '#fbbf24',
      }[slug] || '#0ea5e9'
    // SVG fallback = accent tile with first letter (only if png missing in UI)
    fs.writeFileSync(
      path.join(logosDir, `${slug}-icon.svg`),
      wrapWord(accent, '#fff', [slug.replace(/-/g, ' ').slice(0, 8).toUpperCase()], slug),
    )
    pngSlugs.push({ slug, ext: outExt })
    console.log('raster', slug, outExt, best.length)
  } else {
    console.log('no raster', slug)
  }
}

// Custom geometric / word SVGs for brands without good favicons
fs.writeFileSync(
  path.join(logosDir, 'g-wolves-icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="G-Wolves">
  <rect width="128" height="128" rx="28" fill="#18a058"/>
  <path fill="#fff" d="M64 22c-6 10-18 18-28 22 4 22 14 38 28 52 14-14 24-30 28-52-10-4-22-12-28-22z"/>
  <path fill="#18a058" d="M64 48c-7 0-12 6-12 14 0 10 6 18 12 24 6-6 12-14 12-24 0-8-5-14-12-14z"/>
  <circle cx="56" cy="58" r="3.2" fill="#fff"/>
  <circle cx="72" cy="58" r="3.2" fill="#fff"/>
  <path fill="#fff" d="M58 72h12l-6 8z"/>
  <text x="64" y="112" text-anchor="middle" fill="#fff" font-family="Segoe UI,Arial Black,Arial,sans-serif" font-size="11" font-weight="800" letter-spacing="1.5">G-WOLVES</text>
</svg>
`,
)

fs.writeFileSync(
  path.join(logosDir, 'k-snake-icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="K-snake">
  <rect width="128" height="128" rx="28" fill="#22d3ee"/>
  <path fill="#0c2228" d="M34 70c0-18 12-30 30-30 10 0 18 4 22 10-4-14-16-22-30-22C34 28 18 46 18 70c0 20 12 34 30 36v-12c-10-2-14-12-14-24z"/>
  <path fill="#0c2228" d="M94 58c0 18-12 30-30 30-10 0-18-4-22-10 4 14 16 22 30 22 22 0 38-18 38-42 0-20-12-34-30-36v12c10 2 14 12 14 24z"/>
  <circle cx="48" cy="52" r="4" fill="#fff"/>
  <text x="64" y="112" text-anchor="middle" fill="#0c2228" font-family="Segoe UI,Arial Black,Arial,sans-serif" font-size="12" font-weight="800" letter-spacing="1">K-SNAKE</text>
</svg>
`,
)

for (const [slug, parts] of Object.entries(WORD)) {
  if (!parts) continue
  if (slug === 'g-wolves' || slug === 'k-snake') continue
  fs.writeFileSync(
    path.join(logosDir, `${slug}-icon.svg`),
    wrapWord(parts[0], parts[1], parts[2], slug),
  )
}

const mapLines = pngSlugs
  .map(({ slug, ext }) => `  '${slug}': '${ext}',`)
  .join('\n')

const gen = `/** Auto-generated by generate-openmouse-brand-icons.mjs — do not edit. */
export const OPENMOUSE_LOGO_RASTER: Record<string, 'png' | 'ico'> = {
${mapLines}
}
`
fs.writeFileSync(
  path.join(__dirname, '../src/devices/openmouse/logoAssets.generated.ts'),
  gen,
)
console.log('wrote logoAssets.generated.ts', pngSlugs.length)
console.log('done')
