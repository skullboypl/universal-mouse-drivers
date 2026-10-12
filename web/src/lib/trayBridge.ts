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
  webHidRelay?: boolean
}

export type TrayBatteryPush = {
  percent: number
  charging?: boolean
  deviceKey?: string
  deviceLabel?: string
  vendorId?: number
  productId?: number
}

async function trayFetch(
  path: string,
  init?: RequestInit,
  timeoutMs = 900,
): Promise<Response | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(`${TRAY_BRIDGE_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      cache: 'no-store',
    })
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

export async function fetchTrayStatus(
  timeoutMs = 900,
): Promise<TrayBridgeStatus | null> {
  const res = await trayFetch('/status', undefined, timeoutMs)
  if (!res?.ok) return null
  return (await res.json()) as TrayBridgeStatus
}

export async function setTrayStartup(enabled: boolean): Promise<boolean> {
  const res = await trayFetch('/startup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  return Boolean(res?.ok)
}

export async function openWindowsMouseProps(): Promise<boolean> {
  const res = await trayFetch('/open/windows-mouse', { method: 'POST' })
  return Boolean(res?.ok)
}

/** Ask tray to drop native HID so WebHID can open the control interface. */
export async function yieldTrayHid(): Promise<boolean> {
  const res = await trayFetch(
    '/hid/yield',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
    1200,
  )
  return Boolean(res?.ok)
}

/** Browser closed WebHID — tray may reclaim native battery reads. */
export async function releaseTrayHid(): Promise<boolean> {
  const res = await trayFetch(
    '/hid/release',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      keepalive: true,
    },
    1200,
  )
  return Boolean(res?.ok)
}

/** Push live WebHID battery % into the tray while the browser holds the mouse. */
export async function pushTrayBattery(payload: TrayBatteryPush): Promise<boolean> {
  if (!Number.isFinite(payload.percent)) return false
  const res = await trayFetch(
    '/battery/push',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    },
    1200,
  )
  return Boolean(res?.ok)
}
