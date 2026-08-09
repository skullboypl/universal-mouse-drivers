import fs from 'node:fs'
import path from 'node:path'

/** CapRover Persistent Directory - set DATA_DIR=/app/data in app env. */
export function dataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR
  // Local: repo/data when running next from web/
  return path.resolve(process.cwd(), '..', 'data')
}

export function storePath(): string {
  return path.join(dataDir(), 'umd-store.json')
}

export function downloadsDir(): string {
  return path.join(dataDir(), 'downloads')
}

export function ensureDataDirs() {
  fs.mkdirSync(dataDir(), { recursive: true })
  fs.mkdirSync(downloadsDir(), { recursive: true })
}
