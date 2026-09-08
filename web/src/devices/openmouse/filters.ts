/**
 * OpenMouse HID filters - sync vendor list for SSR scoring;
 * async full SUPPORTED_HID_FILTERS for connect / requestDevice.
 */

import {
  matchesOpenMouseVendor,
  OPENMOUSE_VENDOR_IDS,
} from './constants'
import { OPENMOUSE_CATALOG } from './catalog.generated'

export type OpenMouseHidFilter = HIDDeviceFilter

/** Vendor-only filters (small list) - safe for SSR / scoring. */
export function openMouseHidFilters(): OpenMouseHidFilter[] {
  return OPENMOUSE_VENDOR_IDS.map((vendorId) => ({ vendorId }))
}

/** Product-level filters derived from the generated catalog (no protocol package). */
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

/**
 * Full OpenMouse picker whitelist from the protocol package.
 * Dynamic import so Next SSR never evaluates @openmouse/protocol.
 */
export async function loadOpenMouseHidFilters(): Promise<OpenMouseHidFilter[]> {
  const { SUPPORTED_HID_FILTERS } = await import('@openmouse/protocol/drivers')
  return [...(SUPPORTED_HID_FILTERS as OpenMouseHidFilter[])]
}

export function openMouseSupports(device: Pick<HIDDevice, 'vendorId'>): boolean {
  return matchesOpenMouseVendor(device.vendorId)
}

/** Tie-break score when native UMD did not match (native still wins at +100). */
export function openMouseScore(device: Pick<HIDDevice, 'vendorId'>): number {
  return openMouseSupports(device) ? 20 : 0
}

export { matchesOpenMouseVendor }
