import fs from 'node:fs'
import path from 'node:path'
import { KING_ULTRA_BUTTONS } from '@/devices/redragon-king-ultra/buttons'
import { ensureDataDirs, storePath } from './paths'

export interface ButtonPosition {
  id: number
  uiX: number
  uiY: number
}

export interface DownloadMeta {
  id: string
  filename: string
  displayName: string
  version: string
  signed: boolean
  notes?: string
  updatedAt?: string
}

export interface UmdStore {
  version: number
  buttonLayouts: Record<string, ButtonPosition[]>
  downloads: Record<string, DownloadMeta>
}

const DEFAULT_LAYOUT: ButtonPosition[] = KING_ULTRA_BUTTONS.map((b) => ({
  id: b.id,
  uiX: b.uiX,
  uiY: b.uiY,
}))

function defaultStore(): UmdStore {
  return {
    version: 1,
    buttonLayouts: { 'king-ultra': DEFAULT_LAYOUT },
    downloads: {
      trayBattery: {
        id: 'trayBattery',
        filename: 'UmdBatteryTray.exe',
        displayName: 'UMD Battery Tray',
        version: '1.0.0',
        signed: false,
        notes:
          'Upload EV-signed exe to Persistent Directory /app/data/downloads/',
      },
    },
  }
}

function seedIfMissing() {
  ensureDataDirs()
  const target = storePath()
  if (fs.existsSync(target)) return
  const seedCandidates = [
    path.join(process.cwd(), 'data-seed', 'umd-store.json'),
    path.join(process.cwd(), 'data', 'umd-store.seed.json'),
    path.join(process.cwd(), '..', 'data', 'umd-store.seed.json'),
  ]
  for (const seed of seedCandidates) {
    if (fs.existsSync(seed)) {
      fs.copyFileSync(seed, target)
      return
    }
  }
  fs.writeFileSync(target, JSON.stringify(defaultStore(), null, 2), 'utf8')
}

export function readStore(): UmdStore {
  seedIfMissing()
  try {
    const raw = fs.readFileSync(storePath(), 'utf8')
    const parsed = JSON.parse(raw) as UmdStore
    if (!parsed.buttonLayouts?.['king-ultra']) {
      parsed.buttonLayouts = {
        ...parsed.buttonLayouts,
        'king-ultra': DEFAULT_LAYOUT,
      }
    }
    if (!parsed.downloads) parsed.downloads = defaultStore().downloads
    return parsed
  } catch {
    return defaultStore()
  }
}

export function writeStore(store: UmdStore) {
  ensureDataDirs()
  const tmp = `${storePath()}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8')
  fs.renameSync(tmp, storePath())
}

export function getButtonLayout(deviceId = 'king-ultra'): ButtonPosition[] {
  const store = readStore()
  return store.buttonLayouts[deviceId] ?? DEFAULT_LAYOUT
}

export function setButtonLayout(
  deviceId: string,
  positions: ButtonPosition[],
): ButtonPosition[] {
  const store = readStore()
  store.buttonLayouts[deviceId] = positions
  writeStore(store)
  return positions
}

export function getDownloadMeta(id: string): DownloadMeta | null {
  return readStore().downloads[id] ?? null
}

export function patchDownloadMeta(
  id: string,
  patch: Partial<DownloadMeta>,
): DownloadMeta {
  const store = readStore()
  const prev = store.downloads[id] ?? {
    id,
    filename: `${id}.bin`,
    displayName: id,
    version: '0.0.0',
    signed: false,
  }
  const next = {
    ...prev,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  }
  store.downloads[id] = next
  writeStore(store)
  return next
}
