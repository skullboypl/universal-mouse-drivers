/** Local UmdBatteryTray HTTP bridge (see tray-battery BridgeServer). */
export const TRAY_BRIDGE_URL = 'http://127.0.0.1:17355'

export type TrayBridgeStatus = {
  running: boolean
  version?: string
  runAtStartup?: boolean
  autoUpdate?: boolean
  batteryPercent?: number | null
  charging?: boolean
  device?: string | null
}

export async function fetchTrayStatus(
  timeoutMs = 900,
): Promise<TrayBridgeStatus | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${TRAY_BRIDGE_URL}/status`, {
      signal: ctrl.signal,
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as TrayBridgeStatus
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

export async function setTrayStartup(enabled: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${TRAY_BRIDGE_URL}/startup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function openWindowsMouseProps(): Promise<boolean> {
  try {
    const res = await fetch(`${TRAY_BRIDGE_URL}/open/windows-mouse`, {
      method: 'POST',
    })
    return res.ok
  } catch {
    return false
  }
}
