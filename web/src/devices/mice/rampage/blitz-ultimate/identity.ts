import type { DeviceIdentity } from '../../../types'

/** Hard whitelist — Rampage Blitz only (not King Ultra F54D/F54F). */
export const BLITZ_ULTIMATE_IDENTITY: DeviceIdentity = {
  id: 'rampage-blitz-ultimate',
  brand: 'Rampage',
  model: 'Blitz Ultimate',
  tagline: 'PAW3950 8K gaming mouse',
  vendorId: 0x3554,
  productIds: [0xf562, 0xf563],
  hidIds: ['3554:F562', '3554:F563'],
  status: 'live',
  /** OEM Config.ini Sensor=3950 (base64). */
  sensor: 'PixArt PAW3950',
  imageUrl: '/devices/blitz-ultimate/mouse.png',
  logoUrl: '/devices/blitz-ultimate/logo.svg',
  /** OEM 2Button/dev1.png */
  artWidth: 432,
  artHeight: 356,
}

export function isBlitzUltimateDevice(
  vendorId: number,
  productId: number,
): boolean {
  return (
    vendorId === BLITZ_ULTIMATE_IDENTITY.vendorId &&
    BLITZ_ULTIMATE_IDENTITY.productIds.includes(productId)
  )
}

export function blitzUltimateHidFilters(): Array<{
  vendorId: number
  productId: number
}> {
  return BLITZ_ULTIMATE_IDENTITY.productIds.map((productId) => ({
    vendorId: BLITZ_ULTIMATE_IDENTITY.vendorId,
    productId,
  }))
}
