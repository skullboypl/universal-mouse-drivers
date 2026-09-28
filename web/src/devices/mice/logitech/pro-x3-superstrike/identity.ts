import type { DeviceIdentity } from '../../../types'

export const PRO_X3_SUPERSTRIKE_IDENTITY: DeviceIdentity = {
  id: 'logitech-pro-x3-superstrike',
  brand: 'Logitech G',
  model: 'PRO X3 SUPERSTRIKE',
  tagline: 'HITS · NxLOGI · LIGHTSPEED · 8 kHz',
  vendorId: 0x046d,
  // Passive Windows PnP inventory, 2026-09-26: wired mouse + LIGHTSPEED receiver.
  productIds: [0xc0a9, 0xc54f],
  hidIds: ['046D:C0A9 (USB)', '046D:C54F (LIGHTSPEED)'],
  status: 'wip',
  sensor: 'HERO 2',
  // Official Logitech G product photography (resource.logitechg.com CDN),
  // fetched 2026-09-27 from https://www.logitechg.com/en-us/shop/p/pro-x3-superstrike-mouse
  // and saved locally so the catalog/workspace never depends on a remote
  // hero image. See protocol.ts X3_VARIANTS for the Magenta Eclipse asset.
  imageUrl: '/devices/pro-x3-superstrike/mouse-midnight-black.png',
  artWidth: 1200,
  artHeight: 1028,
}

export function isProX3SuperstrikeDevice(vendorId: number, productId: number) {
  return (
    vendorId === PRO_X3_SUPERSTRIKE_IDENTITY.vendorId &&
    PRO_X3_SUPERSTRIKE_IDENTITY.productIds.includes(productId)
  )
}

export function proX3SuperstrikeHidFilters() {
  return PRO_X3_SUPERSTRIKE_IDENTITY.productIds.map((productId) => ({
    vendorId: PRO_X3_SUPERSTRIKE_IDENTITY.vendorId,
    productId,
  }))
}
