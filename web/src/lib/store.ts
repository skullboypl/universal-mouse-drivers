import fs from 'node:fs'
import path from 'node:path'
import { DEMO_BUTTONS } from '@/devices/mice/demo/identity'
import { FENRIR_MAX_BUTTONS } from '@/devices/mice/gwolves/fenrir-max/buttons'
import { BLITZ_ULTIMATE_BUTTONS } from '@/devices/mice/rampage/blitz-ultimate/buttons'
import { KING_ULTRA_BUTTONS } from '@/devices/mice/redragon/king-ultra/buttons'
import {
  type ButtonPosition,
  type LayoutId,
  LAYOUT_META,
} from './layouts'
import { ensureDataDirs, storePath } from './paths'

export type { ButtonPosition, LayoutId }
export { LAYOUT_META }

/** Keep in sync with tray-battery UmdBatteryTray.csproj Version. */
export const BUNDLED_TRAY_VERSION = '1.9.0'

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

const DEFAULT_BUTTONS: ButtonPosition[] = KING_ULTRA_BUTTONS.map((b) => ({
  id: b.id,
  uiX: b.uiX,
  uiY: b.uiY,
}))

/** Starting points for hero - tune in /admin. */
const DEFAULT_HERO: ButtonPosition[] = [
  { id: 1, uiX: 500, uiY: 640 },
  { id: 2, uiX: 700, uiY: 620 },
  { id: 3, uiX: 600, uiY: 520 },
  { id: 4, uiX: 380, uiY: 760 },
  { id: 5, uiX: 360, uiY: 900 },
  { id: 6, uiX: 720, uiY: 820 },
]

const DEFAULT_DEMO: ButtonPosition[] = DEMO_BUTTONS.map((b) => ({
  id: b.id,
  uiX: b.uiX,
  uiY: b.uiY,
}))

const DEFAULT_FENRIR_MAX: ButtonPosition[] = FENRIR_MAX_BUTTONS.map((b) => ({
  id: b.id,
  uiX: b.uiX,
  uiY: b.uiY,
}))

const DEFAULT_BLITZ: ButtonPosition[] = BLITZ_ULTIMATE_BUTTONS.map((b) => ({
  id: b.id,
  uiX: b.uiX,
  uiY: b.uiY,
}))

function defaultStore(): UmdStore {
  return {
    version: 1,
    buttonLayouts: {
      'king-ultra': DEFAULT_BUTTONS,
      'king-ultra-hero': DEFAULT_HERO,
      'blitz-ultimate': DEFAULT_BLITZ,
      'umd-demo': DEFAULT_DEMO,
      'fenrir-max': DEFAULT_FENRIR_MAX,
    },
    downloads: {
      trayBattery: {
        id: 'trayBattery',
        filename: 'UmdBatteryTray.exe',
        displayName: 'UMD Battery Tray',
        version: BUNDLED_TRAY_VERSION,
        signed: true,
        notes:
          'EV-signed; shipped in image bundled-downloads/ (override via /app/data/downloads/)',
      },
    },
  }
}

function versionNewer(a: string, b: string): boolean {
  const parse = (v: string) =>
    v
      .replace(/^[vV]/, '')
      .split('.')
      .map((x) => Number.parseInt(x, 10) || 0)
  const aa = parse(a)
  const bb = parse(b)
  const n = Math.max(aa.length, bb.length)
  for (let i = 0; i < n; i++) {
    const x = aa[i] ?? 0
    const y = bb[i] ?? 0
    if (x !== y) return x > y
  }
  return false
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

function ensureLayouts(store: UmdStore): UmdStore {
  if (!store.buttonLayouts) store.buttonLayouts = {}
  if (!store.buttonLayouts['king-ultra']) {
    store.buttonLayouts['king-ultra'] = DEFAULT_BUTTONS
  }
  if (!store.buttonLayouts['king-ultra-hero']) {
    store.buttonLayouts['king-ultra-hero'] = DEFAULT_HERO
  }
  if (!store.buttonLayouts['blitz-ultimate']) {
    store.buttonLayouts['blitz-ultimate'] = DEFAULT_BLITZ
  }
  if (!store.buttonLayouts['umd-demo']) {
    store.buttonLayouts['umd-demo'] = DEFAULT_DEMO
  }
  if (!store.buttonLayouts['fenrir-max']) {
    store.buttonLayouts['fenrir-max'] = DEFAULT_FENRIR_MAX
  }
  if (!store.downloads) store.downloads = defaultStore().downloads
  return store
}

/** Returns true when trayBattery.version was raised to BUNDLED_TRAY_VERSION. */
function syncBundledTrayMeta(store: UmdStore): boolean {
  const tray = store.downloads.trayBattery ?? {
    id: 'trayBattery',
    filename: 'UmdBatteryTray.exe',
    displayName: 'UMD Battery Tray',
    version: '0.0.0',
    signed: false,
  }
  store.downloads.trayBattery = tray
  if (!tray.version || versionNewer(BUNDLED_TRAY_VERSION, tray.version)) {
    tray.version = BUNDLED_TRAY_VERSION
    tray.signed = true
    tray.filename = tray.filename || 'UmdBatteryTray.exe'
    tray.updatedAt = new Date().toISOString()
    return true
  }
  return false
}

export function readStore(): UmdStore {
  seedIfMissing()
  try {
    const raw = fs.readFileSync(storePath(), 'utf8')
    const store = ensureLayouts(JSON.parse(raw) as UmdStore)
    if (syncBundledTrayMeta(store)) {
      try {
        writeStore(store)
      } catch {
        /* ignore read-only FS */
      }
    }
    return store
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

export function getButtonLayout(layoutId: LayoutId | string = 'king-ultra'): ButtonPosition[] {
  const store = readStore()
  if (layoutId === 'king-ultra-hero') {
    return store.buttonLayouts['king-ultra-hero'] ?? DEFAULT_HERO
  }
  if (layoutId === 'umd-demo') {
    return store.buttonLayouts['umd-demo'] ?? DEFAULT_DEMO
  }
  if (layoutId === 'fenrir-max') {
    return store.buttonLayouts['fenrir-max'] ?? DEFAULT_FENRIR_MAX
  }
  if (layoutId === 'blitz-ultimate') {
    return store.buttonLayouts['blitz-ultimate'] ?? DEFAULT_BLITZ
  }
  return store.buttonLayouts[layoutId] ?? DEFAULT_BUTTONS
}

export function setButtonLayout(
  layoutId: string,
  positions: ButtonPosition[],
): ButtonPosition[] {
  const store = readStore()
  store.buttonLayouts[layoutId] = positions
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
