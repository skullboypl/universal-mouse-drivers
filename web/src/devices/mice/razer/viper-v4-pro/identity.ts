import type { DeviceIdentity } from '../../../types'
import {
  VIPER_V4_PID_DONGLE,
  VIPER_V4_PID_WIRED,
  VIPER_V4_VENDOR_ID,
} from './protocol'

export const VIPER_V4_PRO_IDENTITY: DeviceIdentity = {
  id: 'razer-viper-v4-pro',
  brand: 'Razer',
  model: 'Viper V4 Pro',
  tagline: 'Focus Pro 35K · HyperSpeed · 8 kHz',
  vendorId: VIPER_V4_VENDOR_ID,
  // Live desk PnP 2026-10-12: HyperSpeed dongle 1532:00E6 (+ wired 00E5).
  productIds: [VIPER_V4_PID_WIRED, VIPER_V4_PID_DONGLE],
  hidIds: ['1532:00E5 (USB)', '1532:00E6 (HyperSpeed)'],
  status: 'wip',
  sensor: 'Focus Pro 35K Optical',
  // Official Razer product render (dl.razerzone.com), resized PNG for Synapse-like hero.
  imageUrl: '/devices/viper-v4-pro/mouse.png',
  artWidth: 900,
  artHeight: 900,
}

export function isViperV4ProDevice(vendorId: number, productId: number) {
  return (
    vendorId === VIPER_V4_PRO_IDENTITY.vendorId &&
    VIPER_V4_PRO_IDENTITY.productIds.includes(productId)
  )
}

export function razerViperV4ProHidFilters() {
  return VIPER_V4_PRO_IDENTITY.productIds.map((productId) => ({
    vendorId: VIPER_V4_PRO_IDENTITY.vendorId,
    productId,
  }))
}
