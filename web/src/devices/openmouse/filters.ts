/**
 * OpenMouse HID filters - catalog VID:PID (+ usage) for pickers;
 * vendor-only list only for coarse SSR scoring.
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

/** Vendor-only filters — do not use for requestDevice (pulls in headphones). */
export function openMouseVendorOnlyHidFilters(): OpenMouseHidFilter[] {
  return OPENMOUSE_VENDOR_IDS.map((vendorId) => ({ vendorId }))
}

/**
 * Product-level filters from the generated catalog (usagePage/usage when known).
 * Prefer this for WebHID requestDevice / connect.
 */
export function openMouseCatalogHidFilters(): OpenMouseHidFilter[] {
  return OPENMOUSE_CATALOG.map((e) => {
    const f: OpenMouseHidFilter = {
      vendorId: e.vendorId,
      productId: e.productId,
    }
    if (e.usagePage != null) f.usagePage = e.usagePage
    if (e.usage != null) f.usage = e.usage
    return f
  })
}

/** Alias used by transport — catalog filters, not vendor-only. */
export function openMouseHidFilters(): OpenMouseHidFilter[] {
  return openMouseCatalogHidFilters()
}

/**
 * Full OpenMouse picker whitelist from the protocol package.
 * Dynamic import so Next SSR never evaluates @openmouse/protocol.
 */
export async function loadOpenMouseHidFilters(): Promise<OpenMouseHidFilter[]> {
  const { SUPPORTED_HID_FILTERS } = await import('@openmouse/protocol/drivers')
  return [...(SUPPORTED_HID_FILTERS as OpenMouseHidFilter[])]
}

/** True when VID:PID appears in the OpenMouse catalog (not vendor alone). */
export function openMouseCatalogSupports(
  device: Pick<HIDDevice, 'vendorId' | 'productId'>,
): boolean {
  return catalogVidPid.has(`${device.vendorId}:${device.productId}`)
}

/**
 * Coarse match for scoring / “maybe OpenMouse”.
 * Prefer openMouseCatalogSupports or createSupportedClient before accepting.
 */
export function openMouseSupports(
  device: Pick<HIDDevice, 'vendorId' | 'productId'>,
): boolean {
  return openMouseCatalogSupports(device)
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
  if (matchesOpenMouseVendor(device.vendorId)) return 5
  return 0
}

export { matchesOpenMouseVendor }
