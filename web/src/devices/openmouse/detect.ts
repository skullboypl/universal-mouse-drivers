/**
 * OpenMouse client factory - dynamic import only (client connect path).
 * Package is patched at postinstall so webpack can resolve subpath exports.
 */

import { findOpenMouseCatalogEntry } from './catalog'
import { isFenrirMaxDevice } from '../mice/gwolves/fenrir-max/identity'

export type OpenMouseMatch = {
  brandLabel: string
  driverId: string
  score: number
}

export type OpenMouseClientBundle = {
  client: unknown
  /** From DEVICE_DRIVERS registry (clients rarely expose .brand). */
  brand: string
  /** HID interface that actually matched (may differ from the picker pick). */
  device: HIDDevice
}

async function resolveBrand(
  client: unknown,
  device: HIDDevice,
  DEVICE_DRIVERS: unknown,
  deviceBrand: (c: never) => string,
): Promise<string> {
  let brand = 'OpenMouse'
  try {
    brand = String(deviceBrand(client as never) || 'OpenMouse')
  } catch {
    const matched = (
      DEVICE_DRIVERS as unknown as Array<{
        brand: string
        supports: (d: HIDDevice) => boolean
      }>
    ).find((d) => {
      try {
        return d.supports(device)
      } catch {
        return false
      }
    })
    brand = matched?.brand ?? 'OpenMouse'
  }
  if (!brand || brand === 'Unknown') {
    brand =
      findOpenMouseCatalogEntry(device.vendorId, device.productId)?.brand ??
      'OpenMouse'
  }
  return brand
}

async function tryCreateOnDevice(
  device: HIDDevice,
): Promise<OpenMouseClientBundle | null> {
  const { createSupportedClient, deviceBrand, DEVICE_DRIVERS } = await import(
    '@openmouse/protocol/drivers'
  )
  const client = await createSupportedClient(device)
  if (!client) return null
  const brand = await resolveBrand(client, device, DEVICE_DRIVERS, deviceBrand)
  return { client, brand, device }
}

/**
 * Calls upstream `createSupportedClient` (DEVICE_DRIVERS supports/create).
 * Retries sibling HID collections with the same VID:PID — dongles often expose
 * several interfaces and the picker may hand us the wrong one.
 */
export async function createOpenMouseClient(
  device: HIDDevice,
): Promise<OpenMouseClientBundle | null> {
  try {
    const first = await tryCreateOnDevice(device)
    if (first) return first

    let siblings: HIDDevice[] = []
    try {
      const hid = navigator.hid
      if (hid) {
        siblings = (await hid.getDevices()).filter(
          (d) =>
            d !== device &&
            d.vendorId === device.vendorId &&
            d.productId === device.productId,
        )
      }
    } catch {
      siblings = []
    }

    for (const sib of siblings) {
      try {
        const hit = await tryCreateOnDevice(sib)
        if (hit) return hit
      } catch {
        /* try next collection */
      }
    }

    if (isFenrirMaxDevice(device.vendorId, device.productId)) {
      throw new Error(
        'Fenrir Max is listed in OpenMouse but this hardware uses the old G-Wolves protocol. Use Native UMD (recommended in the stack chooser) — OpenMouse’s G-Wolves client is the newer HTX/VGN family.',
      )
    }

    const entry = findOpenMouseCatalogEntry(device.vendorId, device.productId)
    if (entry) {
      throw new Error(
        `OpenMouse lists ${entry.brand} ${entry.name}, but no protocol driver matched this HID interface. Try another collection in the picker (vendor feature report / HID++), or reconnect and pick Native if UMD has a dedicated driver.`,
      )
    }

    return null
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.startsWith('Fenrir Max') ||
        err.message.startsWith('OpenMouse lists'))
    ) {
      throw err
    }
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      msg && msg !== 'undefined'
        ? `OpenMouse protocol: ${msg}`
        : 'OpenMouse protocol: createSupportedClient failed',
    )
  }
}

export async function findOpenMouseMatch(
  device: HIDDevice,
): Promise<OpenMouseMatch | null> {
  try {
    const bundle = await createOpenMouseClient(device)
    if (!bundle) return null
    const entry = findOpenMouseCatalogEntry(device.vendorId, device.productId)
    return {
      brandLabel: bundle.brand,
      driverId: entry?.id ?? `openmouse-${bundle.brand.toLowerCase()}`,
      score: 50,
    }
  } catch {
    return null
  }
}
