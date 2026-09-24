/**
 * OpenMouse HID filters.
 *
 * Picker: prefer protocol SUPPORTED_HID_FILTERS (vendor+usage / VID:PID as upstream).
 * Catalog VID:PID is for SSR scoring + hub pages — Logitech is often usage-only
 * (no productId in SUPPORTED_HID_FILTERS), so it never lands in catalog.generated.
 */

import {
  matchesOpenMouseVendor,
  OPENMOUSE_VENDOR_IDS,
} from './constants'
import { OPENMOUSE_CATALOG } from './catalog.generated'

export type OpenMouseHidFilter = HIDDeviceFilter

const catalogVidPid = new Set(
  OPENMOUSE_CATALOG.map((e) => `${e.vendorId}:${e.productId}`),
)

/** Vendor-only — last-resort / scoring; too broad alone for requestDevice. */
export function openMouseVendorOnlyHidFilters(): OpenMouseHidFilter[] {
  return OPENMOUSE_VENDOR_IDS.map((vendorId) => ({ vendorId }))
}

/**
 * Catalog VID:PID without usagePage/usage.
 * Chrome often hides devices when usage filters don't match the exposed collection.
 */
export function openMouseCatalogHidFilters(): OpenMouseHidFilter[] {
  return OPENMOUSE_CATALOG.map((e) => ({
    vendorId: e.vendorId,
    productId: e.productId,
  }))
}

/**
 * Sync filters for requestDevice / allSupportedHidFilters.
 * VID:PID from catalog + vendor-only for brands (e.g. Logitech) that OpenMouse
 * matches by usage at createSupportedClient time, not by productId list.
 */
export function openMouseHidFilters(): OpenMouseHidFilter[] {
  const byKey = new Map<string, OpenMouseHidFilter>()
  for (const f of openMouseCatalogHidFilters()) {
    byKey.set(`${f.vendorId}:${f.productId ?? '*'}`, f)
  }
  for (const vendorId of OPENMOUSE_VENDOR_IDS) {
    const key = `${vendorId}:*`
    if (![...byKey.keys()].some((k) => k.startsWith(`${vendorId}:`))) {
      byKey.set(key, { vendorId })
    }
  }
  // Always keep Logitech / common usage-driven vendors as vendor-wide so they
  // appear even when other PIDs from that VID exist in catalog.
  for (const vendorId of [1133 /* logitech */, 1118 /* microsoft */]) {
    byKey.set(`${vendorId}:*`, { vendorId })
  }
  return [...byKey.values()]
}

/**
 * Full upstream whitelist (includes Logitech usage-page filters).
 * Dynamic import so Next SSR never evaluates @openmouse/protocol.
 */
export async function loadOpenMouseHidFilters(): Promise<OpenMouseHidFilter[]> {
  const { SUPPORTED_HID_FILTERS } = await import('@openmouse/protocol/drivers')
  return [...(SUPPORTED_HID_FILTERS as OpenMouseHidFilter[])]
}

/** True when VID:PID appears in the generated product catalog. */
export function openMouseCatalogSupports(
  device: Pick<HIDDevice, 'vendorId' | 'productId'>,
): boolean {
  return catalogVidPid.has(`${device.vendorId}:${device.productId}`)
}

/**
 * After the user picks a device for OpenMouse: vendor match is enough here;
 * createSupportedClient is the real accept/reject gate (headphones fail it).
 */
export function openMouseSupports(
  device: Pick<HIDDevice, 'vendorId' | 'productId'>,
): boolean {
  return (
    openMouseCatalogSupports(device) || matchesOpenMouseVendor(device.vendorId)
  )
}

/** Product-name heuristics for non-mice sharing a gaming brand VID. */
export function looksLikeNonMouseHid(
  device: Pick<HIDDevice, 'productName'>,
): boolean {
  const n = (device.productName ?? '').toLowerCase()
  if (!n) return false
  return (
    /head(?:set|phone)|earbud|earphone|microphone|mic\b|keyboard|keypad|speaker|webcam|camera|dongle\s*audio|sound\s*card/.test(
      n,
    )
  )
}

/** Tie-break score when native UMD did not match (native still wins at +100). */
export function openMouseScore(
  device: Pick<HIDDevice, 'vendorId' | 'productId'>,
): number {
  if (openMouseCatalogSupports(device)) return 40
  if (matchesOpenMouseVendor(device.vendorId)) return 10
  return 0
}

export { matchesOpenMouseVendor }
