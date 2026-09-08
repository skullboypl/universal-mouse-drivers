/**
 * Build OpenMouse device catalog from @openmouse/protocol.
 * Writes:
 *   - web/src/devices/openmouse/catalog.generated.ts
 *   - tray-battery/UmdBatteryTray/Protocol/OpenMouse/OpenMouseCatalog.g.cs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as drivers from '@openmouse/protocol/drivers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(webRoot, '..')

const {
  SUPPORTED_HID_FILTERS,
  DEVICE_DRIVERS,
  VENDOR_ID,
} = drivers

/** @type {Map<number, { name?: string, model?: string, brand?: string }>} */
const productNameByPid = new Map()
/** @type {Map<number, string>} brand override when PID is known to a map */
const brandByPid = new Map()

/**
 * @param {unknown} map
 * @param {string | null} brand
 * @param {(v: any) => string | null} nameOf
 */
function ingestProductMap(map, brand, nameOf) {
  if (!(map instanceof Map)) return
  for (const [pid, value] of map) {
    if (typeof pid !== 'number') continue
    const name = nameOf(value)
    if (name) {
      const prev = productNameByPid.get(pid)
      if (!prev?.name && !prev?.model) {
        productNameByPid.set(pid, { name, ...(brand ? { brand } : {}) })
      }
    }
    if (brand && !brandByPid.has(pid)) brandByPid.set(pid, brand)
  }
}

for (const [key, value] of Object.entries(drivers)) {
  if (!/PRODUCT/i.test(key)) continue
  if (!(value instanceof Map)) continue
  let brandHint = null
  const k = key.toUpperCase()
  if (k.includes('GLORIOUS')) brandHint = 'Glorious'
  else if (k.includes('WLMOUSE')) brandHint = 'WLMouse'
  ingestProductMap(value, brandHint, (v) => {
    if (!v || typeof v !== 'object') return null
    if (typeof v.name === 'string') return v.name
    if (typeof v.model === 'string') return v.model
    return null
  })
}

try {
  const razer = await import('@openmouse/protocol/razer-devices')
  if (razer.RAZER_PRODUCTS instanceof Map) {
    ingestProductMap(razer.RAZER_PRODUCTS, 'Razer', (v) =>
      typeof v?.model === 'string' ? v.model : null,
    )
  }
} catch (err) {
  console.warn(
    '[generate-openmouse-catalog] razer-devices unavailable:',
    err?.message ?? err,
  )
}

// Optional richer names / PID brand hints (not always re-exported from /drivers).
for (const spec of [
  {
    mod: '@openmouse/protocol/drivers/gwolves/products',
    brand: 'G-Wolves',
    pick: (v) => (typeof v?.model === 'string' ? v.model : null),
  },
  {
    mod: '@openmouse/protocol/steelseries',
    brand: 'SteelSeries',
    exportName: 'STEELSERIES_PRODUCTS',
    pick: (v) =>
      typeof v?.name === 'string'
        ? v.name
        : typeof v?.model === 'string'
          ? v.model
          : null,
  },
]) {
  try {
    const mod = await import(spec.mod)
    const map = mod[spec.exportName ?? 'GWOLVES_PRODUCTS']
    if (map instanceof Map) ingestProductMap(map, spec.brand, spec.pick)
  } catch {
    /* optional */
  }
}

/** @type {Set<number>} */
const atkCompxPids = new Set()
try {
  const atkProducts = await import('@openmouse/protocol/drivers/atk/products')
  for (const pid of atkProducts.ATK_COMPX_PRODUCT_IDS ?? []) {
    atkCompxPids.add(pid)
    brandByPid.set(pid, 'ATK')
  }
} catch {
  /* optional */
}

/** Known VGN F2 PIDs under shared Teevolution/VGN vendor id. */
const VGN_PRODUCT_IDS = new Set([0xfb56, 0xfb57])
for (const pid of VGN_PRODUCT_IDS) brandByPid.set(pid, 'VGN')

/** Display brand for each VENDOR_ID key (align with DEVICE_DRIVERS labels). */
const VENDOR_KEY_BRAND = {
  pulsar: 'Pulsar',
  endgameGear: 'Endgame Gear',
  wlmouse: 'WLMouse',
  lamzu: 'Lamzu',
  lamzuInca: 'Lamzu',
  attackshark: 'Attack Shark',
  logitech: 'Logitech',
  orbital: 'Orbital',
  razer: 'Razer',
  teevolution: 'Teevolution',
  vgn: 'VGN',
  atk: 'ATK',
  finalmouse: 'Finalmouse',
  keychron: 'Keychron',
  moddo: 'moddoMOUSE',
  attackShark: 'Attack Shark',
  attackSharkX: 'Attack Shark',
  ninjutsoLegacy: 'Ninjutso',
  ninjutso: 'Ninjutso',
  zaunkoenig: 'Zaunkoenig',
  corsair: 'Corsair',
  fantech: 'Fantech',
  wooting: 'Wooting',
  wallhack: 'WALLHACK',
  wallhackKeyboardAlt: 'WALLHACK',
  gwolves: 'G-Wolves',
  steelseries: 'SteelSeries',
  glorious: 'Glorious',
  gloriousClassic: 'Glorious',
  gloriousClassicI: 'Glorious',
  gloriousClassicIWired: 'Glorious',
  gloriousO3: 'Glorious',
  mchose: 'MCHOSE',
  ksnakeUsb: 'K-snake',
  ksnakeDongle: 'K-snake',
  microsoft: 'Microsoft',
}

/** Prefer these brands when several VENDOR_ID keys share a VID. */
const BRAND_PREFERENCE = [
  'Razer',
  'Logitech',
  'Glorious',
  'SteelSeries',
  'Pulsar',
  'WLMouse',
  'Lamzu',
  'G-Wolves',
  'Endgame Gear',
  'Finalmouse',
  'Corsair',
  'ATK',
  'Attack Shark',
  'Ninjutso',
  'Orbital',
  'Teevolution',
  'VGN',
  'Keychron',
  'MCHOSE',
  'WALLHACK',
  'Wooting',
  'Fantech',
  'Zaunkoenig',
  'moddoMOUSE',
  'Microsoft',
  'K-snake',
  'Lingbao',
]

/** @type {Map<number, string[]>} */
const brandsByVid = new Map()
for (const [key, vid] of Object.entries(VENDOR_ID)) {
  const brand = VENDOR_KEY_BRAND[key] ?? titleCase(key)
  const list = brandsByVid.get(vid) ?? []
  if (!list.includes(brand)) list.push(brand)
  brandsByVid.set(vid, list)
}

/** Teevolution-only PIDs under shared 0x3554. */
const teevolutionPids = new Set(
  Array.isArray(drivers.TEEVOLUTION_PRODUCT_IDS)
    ? drivers.TEEVOLUTION_PRODUCT_IDS
    : [],
)

const driverBrands = [
  ...new Set(
    (DEVICE_DRIVERS ?? []).map((d) => d.brand).filter(Boolean),
  ),
]

/**
 * @param {number} vendorId
 * @param {number} productId
 */
function resolveBrand(vendorId, productId) {
  // Shared 0x3554 (Teevolution / VGN / ATK CompX / Pulsar receiver)
  if (vendorId === VENDOR_ID.teevolution || vendorId === VENDOR_ID.vgn) {
    if (teevolutionPids.has(productId)) return 'Teevolution'
    if (atkCompxPids.has(productId)) return 'ATK'
    if (VGN_PRODUCT_IDS.has(productId)) return 'VGN'
    if (brandByPid.get(productId) === 'ATK') return 'ATK'
    return 'VGN'
  }

  if (brandByPid.has(productId)) {
    const mapped = brandByPid.get(productId)
    // Razer / WLMouse / Glorious maps are PID-only — confirm VID when possible.
    if (mapped === 'Razer' && vendorId === VENDOR_ID.razer) return mapped
    if (mapped === 'WLMouse' && vendorId === VENDOR_ID.wlmouse) return mapped
    if (
      mapped === 'Glorious' &&
      (vendorId === VENDOR_ID.glorious ||
        vendorId === VENDOR_ID.gloriousClassic ||
        vendorId === VENDOR_ID.gloriousClassicI ||
        vendorId === VENDOR_ID.gloriousClassicIWired ||
        vendorId === VENDOR_ID.gloriousO3)
    ) {
      return mapped
    }
    if (mapped === 'G-Wolves' && vendorId === VENDOR_ID.gwolves) return mapped
    if (mapped === 'SteelSeries' && vendorId === VENDOR_ID.steelseries)
      return mapped
    if (mapped === 'ATK' && vendorId === VENDOR_ID.atk) return mapped
    if (mapped && brandsByVid.get(vendorId)?.includes(mapped)) return mapped
  }

  const candidates = brandsByVid.get(vendorId) ?? []
  if (candidates.length === 1) return candidates[0]
  if (candidates.length > 1) {
    // 0x1915: Orbital is VID+usage only; product-scoped entries are Ninjutso legacy.
    if (vendorId === VENDOR_ID.orbital || vendorId === VENDOR_ID.ninjutsoLegacy) {
      if (candidates.includes('Ninjutso')) return 'Ninjutso'
    }
    // 0x093a Glorious vs Ninjutso — prefer Glorious unless PID map said otherwise.
    if (vendorId === VENDOR_ID.glorious || vendorId === VENDOR_ID.ninjutso) {
      if (candidates.includes('Glorious')) return 'Glorious'
    }
    for (const pref of BRAND_PREFERENCE) {
      if (candidates.includes(pref)) return pref
    }
    return candidates[0]
  }

  // Last resort: any DEVICE_DRIVERS brand string (should not happen).
  return driverBrands[0] ?? 'OpenMouse'
}

/**
 * @param {string} s
 */
function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'device'
}

/**
 * @param {string} s
 */
function titleCase(s) {
  return s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}

/**
 * @param {number} n
 */
function hex4(n) {
  return `0x${n.toString(16).padStart(4, '0')}`
}

/** @type {Map<string, object>} */
const byKey = new Map()

for (const filter of SUPPORTED_HID_FILTERS ?? []) {
  const vendorId = filter?.vendorId
  const productId = filter?.productId
  if (vendorId == null || productId == null) continue

  const key = `${vendorId}:${productId}`
  const existing = byKey.get(key)
  if (existing) {
    // Prefer the filter that carries usage metadata.
    if (existing.usagePage == null && filter.usagePage != null) {
      existing.usagePage = filter.usagePage
      if (filter.usage != null) existing.usage = filter.usage
    }
    continue
  }

  const brand = resolveBrand(vendorId, productId)
  const brandSlug = slugify(brand)
  const mapped = productNameByPid.get(productId)
  const hasProductName = Boolean(
    mapped &&
      (mapped.name || mapped.model) &&
      (mapped.brand == null ||
        mapped.brand === brand ||
        brandByPid.get(productId) === brand),
  )
  const rawName = hasProductName
    ? mapped.name || mapped.model
    : `${brand} ${hex4(vendorId)}:${hex4(productId)}`
  let slug = slugify(rawName)
  // Disambiguate wired/wireless / duplicate model names by PID suffix when needed later.
  const entry = {
    id: '', // filled after slug uniqueness pass
    brand,
    brandSlug,
    slug,
    name: rawName,
    vendorId,
    productId,
    ...(filter.usagePage != null ? { usagePage: filter.usagePage } : {}),
    ...(filter.usage != null ? { usage: filter.usage } : {}),
    hasProductName,
  }
  byKey.set(key, entry)
}

// Unique slugs within brand
/** @type {Map<string, number>} */
const slugCounts = new Map()
for (const entry of byKey.values()) {
  const base = `${entry.brandSlug}/${entry.slug}`
  slugCounts.set(base, (slugCounts.get(base) ?? 0) + 1)
}
/** @type {Map<string, number>} */
const slugSeen = new Map()
for (const entry of byKey.values()) {
  const base = `${entry.brandSlug}/${entry.slug}`
  if ((slugCounts.get(base) ?? 0) > 1) {
    entry.slug = `${entry.slug}-${entry.productId.toString(16)}`
  }
  const idBase = `openmouse-${entry.brandSlug}-${entry.slug}`
  const n = slugSeen.get(idBase) ?? 0
  slugSeen.set(idBase, n + 1)
  entry.id = n === 0 ? idBase : `${idBase}-${n + 1}`
}

const catalog = [...byKey.values()].sort((a, b) => {
  const bc = a.brand.localeCompare(b.brand)
  if (bc !== 0) return bc
  const nc = a.name.localeCompare(b.name)
  if (nc !== 0) return nc
  return a.productId - b.productId
})

const brands = [...new Set(catalog.map((e) => e.brand))].sort((a, b) =>
  a.localeCompare(b),
)

const named = catalog.filter((e) => e.hasProductName).length
const unnamed = catalog.length - named

const tsPath = path.join(webRoot, 'src/devices/openmouse/catalog.generated.ts')
const csDir = path.join(
  repoRoot,
  'tray-battery/UmdBatteryTray/Protocol/OpenMouse',
)
const csPath = path.join(csDir, 'OpenMouseCatalog.g.cs')

function tsLiteral(entry) {
  const parts = [
    `id: ${JSON.stringify(entry.id)}`,
    `brand: ${JSON.stringify(entry.brand)}`,
    `brandSlug: ${JSON.stringify(entry.brandSlug)}`,
    `slug: ${JSON.stringify(entry.slug)}`,
    `name: ${JSON.stringify(entry.name)}`,
    `vendorId: ${entry.vendorId}`,
    `productId: ${entry.productId}`,
  ]
  if (entry.usagePage != null) parts.push(`usagePage: ${entry.usagePage}`)
  if (entry.usage != null) parts.push(`usage: ${entry.usage}`)
  parts.push(`hasProductName: ${entry.hasProductName}`)
  return `  { ${parts.join(', ')} }`
}

const ts = `/* eslint-disable */
/**
 * AUTO-GENERATED by scripts/generate-openmouse-catalog.mjs — do not edit.
 * Source: @openmouse/protocol SUPPORTED_HID_FILTERS + product maps.
 */
export type OpenMouseCatalogEntry = {
  id: string
  brand: string
  brandSlug: string
  slug: string
  name: string
  vendorId: number
  productId: number
  usagePage?: number
  usage?: number
  hasProductName: boolean
}

export const OPENMOUSE_CATALOG: OpenMouseCatalogEntry[] = [
${catalog.map(tsLiteral).join(',\n')}
]

export const OPENMOUSE_BRANDS: string[] = ${JSON.stringify(brands, null, 2)}
`

fs.mkdirSync(path.dirname(tsPath), { recursive: true })
fs.writeFileSync(tsPath, ts, 'utf8')

fs.mkdirSync(csDir, { recursive: true })
const csEntries = catalog
  .map(
    (e) =>
      `        new(${e.vendorId}, ${e.productId}, ${JSON.stringify(e.brand)}, ${JSON.stringify(e.name)}),`,
  )
  .join('\n')

const cs = `// <auto-generated>
// AUTO-GENERATED by web/scripts/generate-openmouse-catalog.mjs — do not edit.
// </auto-generated>
#nullable enable

namespace UmdBatteryTray.Protocol.OpenMouse;

internal static class OpenMouseCatalog
{
    internal readonly record struct Entry(int VendorId, int ProductId, string Brand, string Name);

    public static readonly Entry[] Devices =
    [
${csEntries}
    ];
}
`

fs.writeFileSync(csPath, cs, 'utf8')

console.log(
  `[generate-openmouse-catalog] entries=${catalog.length} brands=${brands.length} named=${named} unnamed=${unnamed}`,
)
console.log(`[generate-openmouse-catalog] wrote ${path.relative(repoRoot, tsPath)}`)
console.log(`[generate-openmouse-catalog] wrote ${path.relative(repoRoot, csPath)}`)
