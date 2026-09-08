/**
 * OpenMouse client factory — dynamic import only (client connect path).
 * Package is patched at postinstall so webpack can resolve subpath exports.
 */

export type OpenMouseMatch = {
  brandLabel: string
  driverId: string
  score: number
}

export async function createOpenMouseClient(
  device: HIDDevice,
): Promise<unknown | null> {
  const { createSupportedClient } = await import('@openmouse/protocol/drivers')
  try {
    return await createSupportedClient(device)
  } catch {
    return null
  }
}

export async function findOpenMouseMatch(
  device: HIDDevice,
): Promise<OpenMouseMatch | null> {
  const { createSupportedClient, DEVICE_DRIVERS } = await import(
    '@openmouse/protocol/drivers'
  )
  try {
    const client = await createSupportedClient(device)
    if (!client) return null
    const brand = String((client as { brand?: string }).brand ?? 'OpenMouse')
    const vid = device.vendorId
    const pid = device.productId
    const entry = (
      DEVICE_DRIVERS as unknown as Array<{
        id: string
        devices?: Array<{ vendorId: number; productId: number }>
      }>
    ).find((d) =>
      d.devices?.some((x) => x.vendorId === vid && x.productId === pid),
    )
    return {
      brandLabel: brand,
      driverId: entry?.id ?? `openmouse-${brand.toLowerCase()}`,
      score: 50,
    }
  } catch {
    return null
  }
}
