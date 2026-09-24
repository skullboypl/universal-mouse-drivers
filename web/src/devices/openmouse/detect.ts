/**
 * OpenMouse client factory - dynamic import only (client connect path).
 * Package is patched at postinstall so webpack can resolve subpath exports.
 */

import { findOpenMouseCatalogEntry } from './catalog'

export type OpenMouseMatch = {
  brandLabel: string
  driverId: string
  score: number
}

export type OpenMouseClientBundle = {
  client: unknown
  /** From DEVICE_DRIVERS registry (clients rarely expose .brand). */
  brand: string
}

/**
 * Calls upstream `createSupportedClient` (DEVICE_DRIVERS supports/create).
 * Throws with a real message on import/runtime failure — do not swallow to null.
 */
export async function createOpenMouseClient(
  device: HIDDevice,
): Promise<OpenMouseClientBundle | null> {
  const { createSupportedClient, deviceBrand, DEVICE_DRIVERS } = await import(
    '@openmouse/protocol/drivers'
  )
  try {
    const client = await createSupportedClient(device)
    if (!client) return null
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
    return { client, brand }
  } catch (err) {
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
