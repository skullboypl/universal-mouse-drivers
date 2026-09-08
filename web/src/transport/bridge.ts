import type { Transport } from './types'

/**
 * Optional local Windows helper (pairing / boot / FW) when WebHID is insufficient.
 * Default endpoint: http://127.0.0.1:17355
 */
export function createBridgeTransport(
  baseUrl = 'http://127.0.0.1:17355',
): Transport {
  let connected = false
  const disconnectListeners = new Set<() => void>()

  return {
    kind: 'bridge',
    label: 'Local bridge',
    async connect() {
      const res = await fetch(`${baseUrl}/health`)
      if (!res.ok) throw new Error('Bridge service not reachable')
      connected = true
    },
    async disconnect() {
      connected = false
      for (const cb of disconnectListeners) cb()
    },
    isConnected() {
      return connected
    },
    async sendFeature(reportId, data, outputData?) {
      const res = await fetch(`${baseUrl}/hid/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          data: [...data],
          outputData: outputData ? [...outputData] : undefined,
        }),
      })
      if (!res.ok) throw new Error('Bridge feature write failed')
    },
    async receiveFeature(reportId) {
      const res = await fetch(`${baseUrl}/hid/feature/${reportId}`)
      if (!res.ok) throw new Error('Bridge feature read failed')
      const json = (await res.json()) as { data: number[] }
      return new Uint8Array(json.data)
    },
    onDisconnect(cb) {
      disconnectListeners.add(cb)
      return () => disconnectListeners.delete(cb)
    },
  }
}
