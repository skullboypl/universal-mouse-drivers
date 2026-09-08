import type { DeviceIdentity } from '../../../types'

/**
 * Logitech PRO X SUPERLIGHT (gen1) over LIGHTSPEED receiver.
 * OMM / live probe: Decompile/mice/logitech/superlight-v1 + omm-2.6.1749
 * Not Superlight 2 (LIGHTSPEED 2) - separate PID/protocol path later.
 */
export const SUPERLIGHT_IDENTITY: DeviceIdentity = {
  id: 'logitech-pro-x-superlight',
  brand: 'Logitech',
  model: 'PRO X SUPERLIGHT',
  tagline: 'LIGHTSPEED · HID++ 2.0 · gen1',
  vendorId: 0x046d,
  /** Gen1 wireless receiver (confirmed live). Wired SKUs can be added after probe. */
  productIds: [0xc547],
  hidIds: ['046D:C547'],
  status: 'wip',
  sensor: 'HERO',
  imageUrl: '/devices/pro-x-superlight/mouse.png',
  artWidth: 800,
  artHeight: 800,
}

export function isSuperlightDevice(
  vendorId: number,
  productId: number,
): boolean {
  return (
    vendorId === SUPERLIGHT_IDENTITY.vendorId &&
    SUPERLIGHT_IDENTITY.productIds.includes(productId)
  )
}

export function superlightHidFilters(): Array<{
  vendorId: number
  productId: number
}> {
  return SUPERLIGHT_IDENTITY.productIds.map((productId) => ({
    vendorId: SUPERLIGHT_IDENTITY.vendorId,
    productId,
  }))
}
