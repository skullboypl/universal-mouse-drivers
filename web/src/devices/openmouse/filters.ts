/**
 * OpenMouse HID filters — static vendor list (Chrome picker size ~30).
 */

import {
  matchesOpenMouseVendor,
  OPENMOUSE_VENDOR_IDS,
} from './constants'

export type OpenMouseHidFilter = HIDDeviceFilter

export function openMouseHidFilters(): OpenMouseHidFilter[] {
  return OPENMOUSE_VENDOR_IDS.map((vendorId) => ({ vendorId }))
}

export function openMouseSupports(device: Pick<HIDDevice, 'vendorId'>): boolean {
  return matchesOpenMouseVendor(device.vendorId)
}

/** Tie-break score when native UMD did not match (native still wins at +100). */
export function openMouseScore(device: Pick<HIDDevice, 'vendorId'>): number {
  return openMouseSupports(device) ? 20 : 0
}

export { matchesOpenMouseVendor }
