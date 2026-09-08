import type { DeviceIdentity } from '../../../types'

/** Hard whitelist - never include Fenrir (33E4) or Wooting (31E3). */
export const KING_ULTRA_IDENTITY: DeviceIdentity = {
  id: 'redragon-king-ultra',
  brand: 'Redragon',
  model: 'King Ultra (M916OB-ULT)',
  tagline: '3-mode gaming mouse',
  vendorId: 0x3554,
  productIds: [0xf54d, 0xf54f, 0xf510],
  hidIds: ['3554:F54D', '3554:F54F', '3554:F510'],
  status: 'live',
  /** Confirmed on M916OB-ULT hardware (OEM Config.ini base64 says 3950 - do not treat as dual SKU). */
  sensor: 'PixArt PAW3395',
  imageUrl: '/devices/king-ultra/mouse.png',
  logoUrl: '/devices/king-ultra/logo.svg',
  /** OEM 2Button/dev1.png */
  artWidth: 432,
  artHeight: 356,
}

export function isKingUltraDevice(vendorId: number, productId: number): boolean {
  return (
    vendorId === KING_ULTRA_IDENTITY.vendorId &&
    KING_ULTRA_IDENTITY.productIds.includes(productId)
  )
}

export function hidFilters(): Array<{ vendorId: number; productId: number }> {
  return KING_ULTRA_IDENTITY.productIds.map((productId) => ({
    vendorId: KING_ULTRA_IDENTITY.vendorId,
    productId,
  }))
}
