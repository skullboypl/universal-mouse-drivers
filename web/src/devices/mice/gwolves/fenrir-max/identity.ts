import type { DeviceIdentity } from '../../../types'

/**
 * G-Wolves Fenrir Max 8K (OEM ModelEN typo: "Fenir Max").
 * Protocol from FENRIR_MOUSE_DRIVERS (GWolvesDriver / old IsNewProtocol=0).
 */
export const FENRIR_MAX_IDENTITY: DeviceIdentity = {
  id: 'gwolves-fenrir-max',
  brand: 'G-Wolves',
  model: 'Fenrir Max 8K',
  tagline: '8K wireless · G-Wolves old protocol',
  vendorId: 0x33e4,
  /** Wired + 8K dongle (PIDWireless4K8K / _8KDongle). */
  productIds: [0x3708, 0x3717],
  hidIds: ['33E4:3708', '33E4:3717'],
  status: 'wip',
  sensor: 'PixArt (OEM)',
  imageUrl: '/devices/fenrir-max/mouse.png',
  logoUrl: undefined,
  /** OEM Config/Fenir/Device.png */
  artWidth: 399,
  artHeight: 558,
}

export function isFenrirMaxDevice(vendorId: number, productId: number): boolean {
  return (
    vendorId === FENRIR_MAX_IDENTITY.vendorId &&
    FENRIR_MAX_IDENTITY.productIds.includes(productId)
  )
}

export function fenrirMaxHidFilters(): Array<{
  vendorId: number
  productId: number
}> {
  return FENRIR_MAX_IDENTITY.productIds.map((productId) => ({
    vendorId: FENRIR_MAX_IDENTITY.vendorId,
    productId,
  }))
}
