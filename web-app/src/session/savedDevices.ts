export interface SavedDevice {
  catalogId: string
  brand: string
  model: string
  vendorId: number
  productId: number
  productName?: string
  lastSeen: string
}

const KEY = 'umd:saved-devices'

export function loadSavedDevices(): SavedDevice[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as SavedDevice[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function rememberDevice(entry: Omit<SavedDevice, 'lastSeen'>): SavedDevice[] {
  const next: SavedDevice = { ...entry, lastSeen: new Date().toISOString() }
  const prev = loadSavedDevices().filter(
    (d) => !(d.vendorId === next.vendorId && d.productId === next.productId),
  )
  const list = [next, ...prev].slice(0, 12)
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export function clearSavedDevices(): void {
  localStorage.removeItem(KEY)
}
