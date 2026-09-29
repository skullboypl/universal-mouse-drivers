import fs from 'node:fs'
import path from 'node:path'
import { dataDir, ensureDataDirs } from './paths'

/** Keep in sync with .github/workflows/openmouse-daily-sync.yml `id`. */
const WORKFLOW_FILE = 'openmouse-daily-sync.yml'
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000
/** How often this process wakes up to check the interval above. */
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

interface SyncState {
  lastDispatchAt?: string
  lastResult?: 'dispatched' | 'skipped' | 'error'
  lastError?: string
}

function statePath(): string {
  return path.join(dataDir(), 'openmouse-sync-state.json')
}

function readState(): SyncState {
  try {
    return JSON.parse(fs.readFileSync(statePath(), 'utf8')) as SyncState
  } catch {
    return {}
  }
}

function writeState(state: SyncState) {
  ensureDataDirs()
  fs.writeFileSync(statePath(), JSON.stringify(state, null, 2), 'utf8')
}

async function dispatchWorkflow(): Promise<void> {
  const token = process.env.GITHUB_ACTIONS_TOKEN
  const repo = process.env.GITHUB_SYNC_REPO ?? 'skullboypl/universal-mouse-drivers'
  const ref = process.env.GITHUB_SYNC_REF ?? 'main'
  if (!token) {
    writeState({
      lastDispatchAt: new Date().toISOString(),
      lastResult: 'skipped',
      lastError: 'GITHUB_ACTIONS_TOKEN not set',
    })
    return
  }

  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref }),
    },
  )

  if (res.ok) {
    writeState({ lastDispatchAt: new Date().toISOString(), lastResult: 'dispatched' })
    return
  }

  writeState({
    lastDispatchAt: new Date().toISOString(),
    lastResult: 'error',
    lastError: `${res.status} ${await res.text().catch(() => '')}`.slice(0, 500),
  })
}

async function tick(): Promise<void> {
  const state = readState()
  const last = state.lastDispatchAt ? Date.parse(state.lastDispatchAt) : 0
  if (Date.now() - last < SYNC_INTERVAL_MS) return
  try {
    await dispatchWorkflow()
  } catch (err) {
    writeState({
      lastDispatchAt: new Date().toISOString(),
      lastResult: 'error',
      lastError: String(err).slice(0, 500),
    })
  }
}

let scheduled = false

/**
 * Starts the in-process schedule. Idempotent - `register()` can run more than
 * once per Next.js dev reload. Fires once shortly after boot (so a fresh
 * deploy without a recent dispatch catches up), then every CHECK_INTERVAL_MS.
 */
export function scheduleOpenMouseDailySync(): void {
  if (scheduled) return
  scheduled = true
  const timer = setInterval(() => void tick(), CHECK_INTERVAL_MS)
  timer.unref?.()
  setTimeout(() => void tick(), 60_000).unref?.()
}
