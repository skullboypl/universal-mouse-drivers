import {
  OPENMOUSE_CATALOG,
  type OpenMouseCatalogEntry,
} from './catalog.generated'
import {
  openMouseBrandDescription,
  openMouseBrandLogoUrl,
  openMouseDeviceDescription,
} from './brandVisuals'

export function getOpenMouseBrands(): string[] {
  return [...new Set(OPENMOUSE_CATALOG.map((e) => e.brandSlug))].sort()
}

export function getOpenMouseBrandLabel(brandSlug: string): string {
  return (
    OPENMOUSE_CATALOG.find((e) => e.brandSlug === brandSlug)?.brand ?? brandSlug
  )
}

export function getOpenMouseBrandCounts(): Array<{
  brandSlug: string
  brand: string
  count: number
  namedCount: number
}> {
  const map = new Map<
    string,
    { brand: string; count: number; namedCount: number }
  >()
  for (const e of OPENMOUSE_CATALOG) {
    const cur = map.get(e.brandSlug) ?? {
      brand: e.brand,
      count: 0,
      namedCount: 0,
    }
    cur.count += 1
    if (e.hasProductName) cur.namedCount += 1
    map.set(e.brandSlug, cur)
  }
  return [...map.entries()]
    .map(([brandSlug, v]) => ({ brandSlug, ...v }))
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand))
}

export function getOpenMouseEntriesForBrand(
  brandSlug: string,
): OpenMouseCatalogEntry[] {
  return OPENMOUSE_CATALOG.filter((e) => e.brandSlug === brandSlug)
}

export function getOpenMouseEntry(
  brandSlug: string,
  slug: string,
): OpenMouseCatalogEntry | undefined {
  return OPENMOUSE_CATALOG.find(
    (e) => e.brandSlug === brandSlug && e.slug === slug,
  )
}

export function getOpenMouseNamedEntries(): OpenMouseCatalogEntry[] {
  const seen = new Set<string>()
  const out: OpenMouseCatalogEntry[] = []
  for (const e of OPENMOUSE_CATALOG) {
    if (!e.hasProductName) continue
    const key = `${e.brandSlug}/${e.slug}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(e)
  }
  return out
}

/** Featured named mice for homepage / hub preview strips. */
export function getOpenMouseFeaturedEntries(
  limit = 12,
): OpenMouseCatalogEntry[] {
  const seen = new Set<string>()
  const out: OpenMouseCatalogEntry[] = []
  for (const e of getOpenMouseNamedEntries()) {
    const key = `${e.brandSlug}::${e.name.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(e)
    if (out.length >= limit) break
  }
  return out
}

export function openMouseDevicePath(brandSlug: string, slug: string): string {
  return `/mice/openmouse/${brandSlug}/${slug}`
}

export function openMouseBrandPath(brandSlug: string): string {
  return `/mice/openmouse/${brandSlug}`
}

export const OPENMOUSE_HUB_PATH = '/mice/openmouse'

/** OG / social preview: brand mark (UI cards use OpenMouseProductMark). */
export function openMouseImageUrl(brandSlug?: string, _productName?: string, _slug?: string): string {
  if (brandSlug) return openMouseBrandLogoUrl(brandSlug)
  return '/devices/openmouse/logos/razer-icon.svg'
}

export function openMouseLogoUrl(brandSlug: string): string {
  return openMouseBrandLogoUrl(brandSlug)
}

export function formatVidPid(vendorId: number, productId: number): string {
  return `${vendorId.toString(16).padStart(4, '0')}:${productId.toString(16).padStart(4, '0')}`
}

/** Dongle / generic USB strings — never use as the mouse model. */
export function isGenericHidProductName(name?: string | null): boolean {
  const n = (name ?? '').trim().toLowerCase()
  if (!n) return true
  return (
    /^(usb\s*)?(wireless\s*)?(receiver|dongle|adapter)$/.test(n) ||
    /^usb\s+receiver$/.test(n) ||
    /^(hid[- ]?compliant\s+)?mouse$/.test(n) ||
    n === 'gaming mouse' ||
    n === '2.4g wireless mouse' ||
    n === 'wireless mouse'
  )
}

/** Catalog row for a live HID VID:PID (named products preferred). */
export function findOpenMouseCatalogEntry(
  vendorId: number,
  productId: number,
): OpenMouseCatalogEntry | undefined {
  const matches = OPENMOUSE_CATALOG.filter(
    (e) => e.vendorId === vendorId && e.productId === productId,
  )
  return matches.find((e) => e.hasProductName) ?? matches[0]
}

/**
 * Brand + model for UI before / without MouseStatus.
 * Prefer OpenMouse catalog over HID productName (dongles report "USB Receiver").
 */
export function resolveOpenMouseIdentityLabels(
  device: Pick<HIDDevice, 'vendorId' | 'productId' | 'productName'>,
  opts?: { brandFromDriver?: string | null; nameFromStatus?: string | null },
): { brand: string; model: string; brandSlug?: string; catalogName?: string } {
  const entry = findOpenMouseCatalogEntry(device.vendorId, device.productId)
  const brandFromDriver = opts?.brandFromDriver?.trim()
  const nameFromStatus = opts?.nameFromStatus?.trim()
  const hidName = device.productName?.trim()
  const brand =
    (brandFromDriver && brandFromDriver !== 'OpenMouse' && brandFromDriver !== 'Unknown'
      ? brandFromDriver
      : null) ||
    entry?.brand ||
    'OpenMouse'
  let model =
    nameFromStatus ||
    (entry?.hasProductName ? entry.name : undefined) ||
    (!isGenericHidProductName(hidName) ? hidName : undefined) ||
    (entry ? entry.name : undefined) ||
    (!isGenericHidProductName(hidName) ? hidName : undefined) ||
    `0x${device.vendorId.toString(16)}:0x${device.productId.toString(16)}`
  // Status often returns "G-Wolves Fenrir" while brand is already G-Wolves.
  if (
    nameFromStatus &&
    brand &&
    nameFromStatus.toLowerCase().startsWith(`${brand.toLowerCase()} `)
  ) {
    model = nameFromStatus.slice(brand.length).trim() || model
  }
  return {
    brand,
    model,
    brandSlug: entry?.brandSlug,
    catalogName: entry?.name,
  }
}

export function describeOpenMouseDevice(
  entry: OpenMouseCatalogEntry,
  locale: string,
): string {
  return openMouseDeviceDescription(
    entry.name,
    entry.brand,
    formatVidPid(entry.vendorId, entry.productId),
    locale,
  )
}

export function describeOpenMouseBrand(
  brandSlug: string,
  locale: string,
): string {
  const entries = getOpenMouseEntriesForBrand(brandSlug)
  const brand = entries[0]?.brand ?? brandSlug
  return openMouseBrandDescription(brand, entries.length, locale)
}

export {
  openMouseDeviceImageUrl,
  openMouseBrandImageUrl,
  openMouseBrandLogoUrl,
  openMouseBrandSlugFromLabel,
  openMouseBrandVisual,
} from './brandVisuals'
