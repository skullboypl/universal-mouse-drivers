import { FenrirMaxDriver } from './mice/gwolves/fenrir-max/driver'
import { FENRIR_MAX_IDENTITY } from './mice/gwolves/fenrir-max/identity'
import { SuperlightDriver } from './mice/logitech/pro-x-superlight/driver'
import { SUPERLIGHT_IDENTITY } from './mice/logitech/pro-x-superlight/identity'
import { BlitzUltimateDriver } from './mice/rampage/blitz-ultimate/driver'
import { BLITZ_ULTIMATE_IDENTITY } from './mice/rampage/blitz-ultimate/identity'
import { KING_ULTRA_IDENTITY } from './mice/redragon/king-ultra/identity'
import { KingUltraDriver } from './mice/redragon/king-ultra/driver'
import {
  OPENMOUSE_BACKED_ID,
  createOpenMouseDriver,
  openMouseBrandNames,
} from './openmouse'
import type { DeviceDriver } from './DeviceDriver'
import type { DeviceIdentity } from './types'

/** Catalog card for OpenMouse-backed mice (not a single SKU). */
export const OPENMOUSE_BACKED_IDENTITY: DeviceIdentity = {
  id: OPENMOUSE_BACKED_ID,
  brand: 'OpenMouse',
  model: 'Community devices',
  tagline: `OpenMouse protocols · ${openMouseBrandNames().slice(0, 6).join(', ')}…`,
  vendorId: 0,
  productIds: [],
  hidIds: ['multi-vendor'],
  status: 'openmouse',
  sensor: 'Varies by OpenMouse driver',
  imageUrl: '/devices/openmouse/mouse.svg',
}

export { OPENMOUSE_BACKED_ID }

/** Public support matrix shown on the UMD home screen. */
export const DEVICE_CATALOG: DeviceIdentity[] = [
  KING_ULTRA_IDENTITY,
  BLITZ_ULTIMATE_IDENTITY,
  FENRIR_MAX_IDENTITY,
  SUPERLIGHT_IDENTITY,
  OPENMOUSE_BACKED_IDENTITY,
]

export function findCatalogDevice(
  vendorId: number,
  productId: number,
): DeviceIdentity | undefined {
  return DEVICE_CATALOG.find(
    (d) =>
      d.id !== OPENMOUSE_BACKED_ID &&
      d.vendorId === vendorId &&
      d.productIds.includes(productId),
  )
}

export function createDriver(deviceId: string): DeviceDriver {
  if (deviceId === KING_ULTRA_IDENTITY.id) return new KingUltraDriver()
  if (deviceId === BLITZ_ULTIMATE_IDENTITY.id) return new BlitzUltimateDriver()
  if (deviceId === FENRIR_MAX_IDENTITY.id) return new FenrirMaxDriver()
  if (deviceId === SUPERLIGHT_IDENTITY.id) return new SuperlightDriver()
  if (deviceId === OPENMOUSE_BACKED_ID) return createOpenMouseDriver()
  throw new Error(`Unknown device: ${deviceId}`)
}
