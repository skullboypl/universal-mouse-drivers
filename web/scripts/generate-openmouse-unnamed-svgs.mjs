import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = path.join(root, 'src/devices/openmouse/catalog.generated.ts')
const outDir = path.join(root, 'public/devices/openmouse/models')

const VISUALS = {
  atk: ['#ff4d4d', 'AT'],
  corsair: ['#ffd700', 'CO'],
  fantech: ['#e85d04', 'FT'],
  finalmouse: ['#f5f5f5', 'FM'],
  'g-wolves': ['#18a058', 'GW'],
  glorious: ['#c084fc', 'GL'],
  'k-snake': ['#22d3ee', 'KS'],
  keychron: ['#60a5fa', 'KC'],
  lamzu: ['#fb7185', 'LZ'],
  mchose: ['#a3e635', 'MC'],
  microsoft: ['#00a4ef', 'MS'],
  ninjutso: ['#f97316', 'NJ'],
  pulsar: ['#e11d48', 'PU'],
  razer: ['#44d62c', 'RZ'],
  steelseries: ['#ff6400', 'SS'],
  teevolution: ['#38bdf8', 'TV'],
  vgn: ['#fbbf24', 'VG'],
  wallhack: ['#e2e8f0', 'WH'],
  wooting: ['#ff5a36', 'WO'],
  zaunkoenig: ['#94a3b8', 'ZK'],
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function svg(brand, brandSlug, name) {
  const [accent, mark] = VISUALS[brandSlug] || ['#0ea5e9', 'OM']
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" role="img" aria-label="${esc(brand)} ${esc(name)}">
  <defs>
    <linearGradient id="body" x1="120" y1="40" x2="280" y2="320" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3a414c"/><stop offset="1" stop-color="#15181e"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <image href="/devices/openmouse/logos/${brandSlug}-icon.svg" x="18" y="18" width="64" height="64"/>
  <text x="98" y="44" fill="#f3f4f6" font-family="Segoe UI,Arial,sans-serif" font-size="18" font-weight="700">${esc(brand)}</text>
  <text x="98" y="72" fill="${accent}" font-family="Segoe UI,Arial,sans-serif" font-size="16" font-weight="650">${esc(name)}</text>
  <g filter="url(#soft)" transform="translate(48,86)">
    <path fill="url(#body)" stroke="${accent}" stroke-width="3" d="M152 18c54 0 98 44 98 108 0 78-42 148-98 176-56-28-98-98-98-176C54 62 98 18 152 18z"/>
    <path d="M152 42v78" stroke="#6b7280" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="152" cy="138" rx="18" ry="30" fill="#0f1218" stroke="${accent}" stroke-width="2.5"/>
    <path d="M78 120c-10 28-12 58-8 86" fill="none" stroke="#4b5563" stroke-width="10" stroke-linecap="round"/>
    <circle cx="152" cy="268" r="26" fill="${accent}"/>
    <text x="152" y="274" text-anchor="middle" fill="#0a0c10" font-family="Segoe UI,Arial Black,sans-serif" font-size="13" font-weight="800">${esc(mark)}</text>
  </g>
</svg>`
}

const src = fs.readFileSync(catalogPath, 'utf8')
const re =
  /\{\s*id:\s*"([^"]+)",\s*brand:\s*"([^"]+)",\s*brandSlug:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)",[\s\S]*?hasProductName:\s*(true|false)/g
let n = 0
let m
while ((m = re.exec(src))) {
  if (m[6] !== 'false') continue
  const brand = m[2]
  const brandSlug = m[3]
  const slug = m[4]
  const name = m[5]
  const dir = path.join(outDir, brandSlug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${slug}.svg`), svg(brand, brandSlug, name))
  n++
}
console.log('unnamed svg', n)
