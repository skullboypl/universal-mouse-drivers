import { OPENMOUSE_BACKED_ID } from '@/devices/openmouse/constants'

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
const MAX = 12

function isOpenMouseEntry(d: Pick<SavedDevice, 'catalogId'>): boolean {
  return d.catalogId === OPENMOUSE_BACKED_ID
}

/** Same physical/logical mouse — native SKUs collapse by catalogId. */
export function isSameSavedDevice(
  a: Pick<SavedDevice, 'catalogId' | 'vendorId' | 'productId'>,
  b: Pick<SavedDevice, 'catalogId' | 'vendorId' | 'productId'>,
): boolean {
  if (isOpenMouseEntry(a) || isOpenMouseEntry(b)) {
    return a.vendorId === b.vendorId && a.productId === b.productId
  }
  if (a.catalogId && a.catalogId === b.catalogId) return true
  return a.vendorId === b.vendorId && a.productId === b.productId
}

/** Newest first; drop duplicate catalog / VID:PID entries. */
export function dedupeSavedDevices(list: SavedDevice[]): SavedDevice[] {
  const sorted = [...list].sort(
    (a, b) => Date.parse(b.lastSeen) - Date.parse(a.lastSeen),
  )
  const out: SavedDevice[] = []
  for (const entry of sorted) {
    if (out.some((kept) => isSameSavedDevice(kept, entry))) continue
    out.push(entry)
  }
  return out.slice(0, MAX)
}

function persist(list: SavedDevice[]): SavedDevice[] {
  const next = dedupeSavedDevices(list)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function loadSavedDevices(): SavedDevice[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as SavedDevice[]
    if (!Array.isArray(list)) return []
    const clean = dedupeSavedDevices(list)
    // Rewrite storage when older duplicates are present.
    if (clean.length !== list.length) {
      localStorage.setItem(KEY, JSON.stringify(clean))
    }
    return clean
  } catch {
    return []
  }
}

export function rememberDevice(entry: Omit<SavedDevice, 'lastSeen'>): SavedDevice[] {
  const next: SavedDevice = { ...entry, lastSeen: new Date().toISOString() }
  const prev = loadSavedDevices().filter((d) => !isSameSavedDevice(d, next))
  return persist([next, ...prev])
}

export function removeSavedDevice(
  match: Pick<SavedDevice, 'catalogId' | 'vendorId' | 'productId'>,
): SavedDevice[] {
  const next = loadSavedDevices().filter((d) => !isSameSavedDevice(d, match))
  return persist(next)
}

export function clearSavedDevices(): void {
  localStorage.removeItem(KEY)
}
