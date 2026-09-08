export type TransportKind = 'mock' | 'webhid' | 'bridge'

/** `bulk` = shorter ack window, skip follow-up when payload already looks live. */
export type SendPace = 'default' | 'bulk'

export interface Transport {
  readonly kind: TransportKind
  readonly label: string
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  /**
   * Send a protocol frame. Prefer OEM Output (17-byte wire via `outputData`);
   * Feature report is fallback only.
   */
  sendFeature(
    reportId: number,
    data: Uint8Array,
    outputData?: Uint8Array,
    pace?: SendPace,
  ): Promise<void>
  receiveFeature(reportId: number): Promise<Uint8Array>
  /** Wait for next OEM input report (id 8), optional command filter. */
  waitInput?(
    opts?: { commandId?: number; timeoutMs?: number },
  ): Promise<Uint8Array | null>
  onDisconnect(cb: () => void): () => void
}
