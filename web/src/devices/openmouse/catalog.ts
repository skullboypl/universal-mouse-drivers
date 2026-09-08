import {
  OPENMOUSE_CATALOG,
  type OpenMouseCatalogEntry,
} from './catalog.generated'

export function getOpenMouseBrands(): string[] {
  return [...new Set(OPENMOUSE_CATALOG.map((e) => e.brandSlug))].sort()
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

export function openMouseDevicePath(
  brandSlug: string,
  slug: string,
): string {
  return `/mice/openmouse/${brandSlug}/${slug}`
}

export function openMouseBrandPath(brandSlug: string): string {
  return `/mice/openmouse/${brandSlug}`
}

export const OPENMOUSE_HUB_PATH = '/mice/openmouse'

export function openMouseImageUrl(): string {
  return '/devices/openmouse/mouse.svg'
}
