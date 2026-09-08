import type { Transport } from './types'

export function createMockTransport(): Transport {
  let connected = false
  const disconnectListeners = new Set<() => void>()
  const featureStore = new Map<number, Uint8Array>()

  return {
    kind: 'mock',
    label: 'Mock device',
    async connect() {
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
      if (!connected) throw new Error('Mock transport not connected')
      featureStore.set(reportId, new Uint8Array(data))
      console.info('[mock] sendFeature', reportId, {
        data: [...data],
        outputData: outputData ? [...outputData] : undefined,
      })
    },
    async receiveFeature(reportId) {
      if (!connected) throw new Error('Mock transport not connected')
      return featureStore.get(reportId) ?? new Uint8Array(64)
    },
    onDisconnect(cb) {
      disconnectListeners.add(cb)
      return () => disconnectListeners.delete(cb)
    },
  }
}
