import { umdLog } from '../debug/umdLog'
import {
  fenrirMaxHidFilters,
  isFenrirMaxDevice,
} from '../devices/mice/gwolves/fenrir-max/identity'
import {
  isSuperlightDevice,
  superlightHidFilters,
} from '../devices/mice/logitech/pro-x-superlight/identity'
import {
  blitzUltimateHidFilters,
  isBlitzUltimateDevice,
} from '../devices/mice/rampage/blitz-ultimate/identity'
import {
  hidFilters,
  isKingUltraDevice,
} from '../devices/mice/redragon/king-ultra/identity'
import {
  OPENMOUSE_BACKED_ID,
  matchesOpenMouseVendor,
  openMouseHidFilters,
  openMouseScore,
  openMouseSupports,
} from '../devices/openmouse'
import type { Transport } from './types'

export interface HidDeviceInfo {
  vendorId: number
  productId: number
  productName?: string
  featureReportId?: number
  featurePayloadSize?: number
  outputReportId?: number
  outputPayloadSize?: number
  writePath?: 'output' | 'feature'
}

export interface WebHidTransport extends Transport {
  getDeviceInfo(): HidDeviceInfo | null
  connectPreferred(productId?: number): Promise<void>
  getLastAck(): Uint8Array | null
}

interface HIDReportItem {
  reportSize?: number
  reportCount?: number
}

function assertWebHid(): HID {
  if (!navigator.hid) {
    throw new Error('WebHID unavailable - use Chrome/Edge on umdrivers.com')
  }
  return navigator.hid
}

function reportPayloadBytes(report: HIDReportInfo): number {
  const items = (report.items ?? []) as HIDReportItem[]
  let bits = 0
  for (const item of items) {
    bits += (item.reportSize ?? 0) * (item.reportCount ?? 0)
  }
  return Math.ceil(bits / 8)
}

function collectReports(
  device: HIDDevice,
  kind: 'feature' | 'output' | 'input',
): { reportId: number; payloadSize: number }[] {
  const found: { reportId: number; payloadSize: number }[] = []
  for (const c of device.collections ?? []) {
    const list =
      kind === 'feature'
        ? c.featureReports
        : kind === 'output'
          ? c.outputReports
          : c.inputReports
    for (const r of list ?? []) {
      const payloadSize = reportPayloadBytes(r)
      if (payloadSize > 0) found.push({ reportId: r.reportId, payloadSize })
    }
  }
  return found
}

/**
 * OEM WriteFile sends 17 bytes where byte0 is Report ID 0x08 and the remaining
 * 16 bytes are the HID output payload (matches descriptor ff02: id=8, n=16).
 */
function pickOemOutput(
  outs: { reportId: number; payloadSize: number }[],
): { reportId: number; payloadSize: number } | null {
  const exact = outs.find((r) => r.reportId === 8 && r.payloadSize === 16)
  if (exact) return exact
  const id8 = outs.find((r) => r.reportId === 8)
  if (id8) return id8
  const size16 = outs.find((r) => r.payloadSize === 16)
  if (size16) return size16
  return outs[0] ?? null
}

/** King Ultra + Blitz Ultimate share HIDUsb V11 transport (report id 8). */
function isOemHidUsbDevice(vendorId: number, productId: number): boolean {
  return (
    isKingUltraDevice(vendorId, productId) ||
    isBlitzUltimateDevice(vendorId, productId)
  )
}

function oemHidUsbFilters(): Array<{ vendorId: number; productId: number }> {
  return [...hidFilters(), ...blitzUltimateHidFilters()]
}

function scoreDevice(device: HIDDevice): number {
  let score = 0
  if (isOemHidUsbDevice(device.vendorId, device.productId)) score += 100
  if (isFenrirMaxDevice(device.vendorId, device.productId)) score += 100
  if (isSuperlightDevice(device.vendorId, device.productId)) score += 100
  // OpenMouse-backed (lower than native UMD so King/Blitz/Fenrir/SL win ties)
  if (openMouseSupports(device)) score += 40 + Math.min(40, openMouseScore(device))
  const outs = collectReports(device, 'output')
  const feats = collectReports(device, 'feature')
  const ins = collectReports(device, 'input')
  // Exact OEM channel: Output+Input report id 8, 16 bytes (usage page ff02)
  if (outs.some((r) => r.reportId === 8 && r.payloadSize === 16)) score += 120
  else if (outs.some((r) => r.reportId === 8)) score += 60
  else if (outs.length) score += 20
  if (ins.some((r) => r.reportId === 8 && r.payloadSize === 16)) score += 40
  // G-Wolves Fenrir: feature report 64B is the config channel
  if (feats.some((r) => r.payloadSize >= 64)) score += 80
  // Logitech Superlight: HID++ long report 0x11 on vendor page
  if (outs.some((r) => r.reportId === 0x11 && r.payloadSize >= 19)) score += 100
  else if (outs.some((r) => r.reportId === 0x11)) score += 50
  for (const c of device.collections ?? []) {
    if (c.usagePage === 0xff02) score += 50
    else if (c.usagePage === 0xff00 && c.usage === 0x02) score += 80
    else if (c.usagePage >= 0xff00) score += 10
  }
  return score
}

export function allSupportedHidFilters(): Array<{
  vendorId?: number
  productId?: number
  usagePage?: number
  usage?: number
}> {
  return [
    ...oemHidUsbFilters(),
    ...fenrirMaxHidFilters(),
    ...superlightHidFilters(),
    ...openMouseHidFilters(),
  ]
}

export function isSupportedUmdDevice(
  vendorId: number,
  productId: number,
): boolean {
  return (
    isOemHidUsbDevice(vendorId, productId) ||
    isFenrirMaxDevice(vendorId, productId) ||
    isSuperlightDevice(vendorId, productId) ||
    matchesOpenMouseVendor(vendorId)
  )
}

/** Target a specific saved / catalog mouse - never cross-brand fallback. */
export type HidPickTarget = {
  productId?: number
  vendorId?: number
  /** When set, only that family's VID:PIDs are offered / accepted. */
  catalogId?: string
  /**
   * Always open the Chrome/Edge HID chooser.
   * Skips auto-connect to a previously authorized device from getDevices().
   */
  forcePicker?: boolean
}

function filtersForTarget(target?: HidPickTarget): Array<{
  vendorId?: number
  productId?: number
  usagePage?: number
  usage?: number
}> {
  if (target?.catalogId === 'gwolves-fenrir-max') return fenrirMaxHidFilters()
  if (target?.catalogId === 'redragon-king-ultra') return hidFilters()
  if (target?.catalogId === 'rampage-blitz-ultimate') {
    return blitzUltimateHidFilters()
  }
  if (target?.catalogId === 'logitech-pro-x-superlight') {
    return superlightHidFilters()
  }
  if (target?.catalogId === OPENMOUSE_BACKED_ID) {
    return openMouseHidFilters()
  }
  if (target?.vendorId != null && target?.productId != null) {
    return [{ vendorId: target.vendorId, productId: target.productId }]
  }
  if (target?.vendorId != null) {
    return allSupportedHidFilters().filter((f) => f.vendorId === target.vendorId)
  }
  return allSupportedHidFilters()
}

function matchesTarget(device: HIDDevice, target?: HidPickTarget): boolean {
  if (!target) {
    return (
      isSupportedUmdDevice(device.vendorId, device.productId) ||
      openMouseSupports(device)
    )
  }
  if (target.catalogId === 'gwolves-fenrir-max') {
    return isFenrirMaxDevice(device.vendorId, device.productId)
  }
  if (target.catalogId === 'redragon-king-ultra') {
    return isKingUltraDevice(device.vendorId, device.productId)
  }
  if (target.catalogId === 'rampage-blitz-ultimate') {
    return isBlitzUltimateDevice(device.vendorId, device.productId)
  }
  if (target.catalogId === 'logitech-pro-x-superlight') {
    return isSuperlightDevice(device.vendorId, device.productId)
  }
  if (target.catalogId === OPENMOUSE_BACKED_ID) {
    return openMouseSupports(device)
  }
  if (target.vendorId != null && device.vendorId !== target.vendorId) return false
  if (target.productId != null && device.productId !== target.productId) {
    // Same family only when catalog not given but vendor matches King/Fenrir set
    if (target.vendorId != null) {
      if (isKingUltraDevice(target.vendorId, target.productId)) {
        return isKingUltraDevice(device.vendorId, device.productId)
      }
      if (isBlitzUltimateDevice(target.vendorId, target.productId)) {
        return isBlitzUltimateDevice(device.vendorId, device.productId)
      }
      if (isFenrirMaxDevice(target.vendorId, target.productId)) {
        return isFenrirMaxDevice(device.vendorId, device.productId)
      }
      if (isSuperlightDevice(target.vendorId, target.productId)) {
        return isSuperlightDevice(device.vendorId, device.productId)
      }
    }
    return false
  }
  return (
    isSupportedUmdDevice(device.vendorId, device.productId) ||
    openMouseSupports(device)
  )
}

/**
 * Pick a supported mouse without opening it.
 * With a saved/catalog VID:PID target, may reuse an already-authorized device.
 * With forcePicker (or no specific VID/PID), always shows the browser chooser.
 */
export async function pickSupportedHidDevice(
  target?: number | HidPickTarget,
): Promise<HIDDevice> {
  const opts: HidPickTarget | undefined =
    typeof target === 'number' ? { productId: target } : target
  const hid = assertWebHid()
  const filters = filtersForTarget(opts)
  const hasSpecificPid = opts?.productId != null
  const forcePicker =
    opts?.forcePicker === true ||
    (!hasSpecificPid && opts?.vendorId == null)

  let selected: HIDDevice | undefined

  if (!forcePicker) {
    const existing = (await hid.getDevices())
      .filter((d) => matchesTarget(d, opts))
      .sort((a, b) => scoreDevice(b) - scoreDevice(a))

    if (hasSpecificPid) {
      selected = existing.find((d) => d.productId === opts!.productId)
      // Same catalog/family only - never another brand
      if (!selected && opts?.catalogId) {
        selected = existing[0]
      } else if (!selected && opts?.vendorId != null) {
        selected = existing.find((d) => d.vendorId === opts.vendorId)
      }
    }
  }

  if (!selected) {
    const picked = await hid.requestDevice({ filters })
    const ranked = [...picked]
      .filter((d) => matchesTarget(d, opts))
      .sort((a, b) => scoreDevice(b) - scoreDevice(a))
    if (hasSpecificPid) {
      selected =
        ranked.find((d) => d.productId === opts!.productId) ??
        (opts?.catalogId || opts?.vendorId != null ? ranked[0] : undefined)
    } else {
      selected = ranked[0]
    }
  }
  if (!selected) {
    throw new Error(
      opts?.catalogId || opts?.productId != null
        ? 'Wybrana mysz nie jest podłączona / nie wybrano jej w oknie HID'
        : 'No supported mouse selected',
    )
  }
  return selected
}

function padPayload(data: Uint8Array, payloadSize: number): Uint8Array {
  if (data.length === payloadSize) return data
  if (data.length > payloadSize) return data.slice(0, payloadSize)
  const out = new Uint8Array(payloadSize)
  out.set(data)
  return out
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/** OEM WriteFile buffer (17 B): [reportId=8, ...16 payload bytes]. */
export function toOemWire17(featurePayload19: Uint8Array): Uint8Array {
  if (featurePayload19.length >= 19 && featurePayload19[2] === 0x08) {
    return featurePayload19.slice(2, 19)
  }
  if (featurePayload19.length === 17 && featurePayload19[0] === 0x08) {
    return featurePayload19
  }
  return featurePayload19.slice(0, 17)
}

/** WebHID sendReport data = wire17 without leading report id. */
export function toOemOutput16(wire17: Uint8Array): Uint8Array {
  if (wire17.length >= 17 && wire17[0] === 0x08) return wire17.slice(1, 17)
  if (wire17.length === 16) return wire17
  return wire17.slice(0, 16)
}

export function createWebHidTransport(): WebHidTransport {
  let device: HIDDevice | null = null
  let featureReportId = 1
  let featurePayloadSize = 19
  let outputReportId = 8
  let outputPayloadSize = 16
  let writePath: 'output' | 'feature' | null = null
  let writeChain: Promise<void> = Promise.resolve()
  let lastAck: Uint8Array | null = null
  const disconnectListeners = new Set<() => void>()

  const onDisconnect = (ev: HIDConnectionEvent) => {
    if (device && ev.device === device) {
      device = null
      writePath = null
      for (const cb of disconnectListeners) cb()
    }
  }

  function waitInputReport(opts?: {
    commandId?: number
    timeoutMs?: number
  }): Promise<Uint8Array | null> {
    const dev = device
    if (!dev) return Promise.resolve(null)
    const timeoutMs = opts?.timeoutMs ?? 800
    return new Promise((resolve) => {
      let done = false
      const timer = setTimeout(() => {
        if (done) return
        done = true
        dev.removeEventListener('inputreport', onReport)
        resolve(null)
      }, timeoutMs)
      const onReport = (ev: HIDInputReportEvent) => {
        if (ev.device !== dev) return
        if (ev.reportId !== 8 && ev.reportId !== outputReportId) return
        const bytes = new Uint8Array(
          ev.data.buffer,
          ev.data.byteOffset,
          ev.data.byteLength,
        )
        if (opts?.commandId != null && bytes[0] !== opts.commandId) return
        if (done) return
        done = true
        clearTimeout(timer)
        dev.removeEventListener('inputreport', onReport)
        umdLog('webhid', 'info', 'ack', {
          reportId: ev.reportId,
          data: [...bytes].slice(0, 17),
        })
        resolve(bytes)
      }
      dev.addEventListener('inputreport', onReport)
    })
  }

  async function openSelected(selected: HIDDevice) {
    if (!isOemHidUsbDevice(selected.vendorId, selected.productId)) {
      throw new Error(
        `Refused device ${selected.vendorId.toString(16)}:${selected.productId.toString(16)}`,
      )
    }
    if (!selected.opened) await selected.open()
    const outs = collectReports(selected, 'output')
    const feats = collectReports(selected, 'feature')
    const out = pickOemOutput(outs)
    const feat =
      feats.find((f) => f.reportId === 1) ??
      feats.find((f) => f.payloadSize >= 19) ??
      feats[0] ??
      null
    if (!out && !feat) {
      await selected.close().catch(() => undefined)
      throw new Error(
        'No HID Output/Feature reports - pick the 8K receiver / vendor interface',
      )
    }
    if (out) {
      outputReportId = out.reportId
      // Do NOT inflate past descriptor - OEM channel is exactly 16 payload bytes
      outputPayloadSize = out.payloadSize
    }
    if (feat) {
      featureReportId = feat.reportId
      featurePayloadSize = feat.payloadSize
    }
    device = selected
    writePath = null
    assertWebHid().addEventListener('disconnect', onDisconnect)
    umdLog('webhid', 'info', 'opened', {
      productId: selected.productId.toString(16),
      productName: selected.productName,
      score: scoreDevice(selected),
      outputReportId,
      outputPayloadSize,
      featureReportId,
      featurePayloadSize,
      collections: selected.collections?.map((c) => ({
        usagePage: c.usagePage.toString(16),
        usage: c.usage,
        output: c.outputReports?.map((r) => ({
          id: r.reportId,
          n: reportPayloadBytes(r),
        })),
        feature: c.featureReports?.map((r) => ({
          id: r.reportId,
          n: reportPayloadBytes(r),
        })),
        input: c.inputReports?.map((r) => ({
          id: r.reportId,
          n: reportPayloadBytes(r),
        })),
      })),
    })
  }

  function ackLooksLive(ack: Uint8Array): boolean {
    // cmd,status,addrHi,addrLo,flags - status=1 + empty data = dongle echo
    if (ack.length < 6) return false
    const status = ack[1] & 0xff
    const len = (ack[4] & 0x7f) || 10
    let any = false
    for (let i = 5; i < Math.min(ack.length, 5 + len); i++) {
      if (ack[i] !== 0) {
        any = true
        break
      }
    }
    return status !== 1 && any
  }

  async function tryOemOutput(
    wire17: Uint8Array,
    pace: 'default' | 'bulk' = 'default',
  ): Promise<boolean> {
    if (!device?.opened) return false
    const outs = collectReports(device, 'output')
    if (outs.length === 0) return false
    const bulk = pace === 'bulk'

    // Primary: report 8 + 16-byte payload (WriteFile stripped of report id)
    const attempts: { id: number; data: Uint8Array; label: string }[] = [
      {
        id: 8,
        data: toOemOutput16(wire17),
        label: 'id8/16 (OEM WriteFile)',
      },
    ]
    if (outputReportId !== 8 || outputPayloadSize !== 16) {
      attempts.push({
        id: outputReportId,
        data: padPayload(toOemOutput16(wire17), outputPayloadSize),
        label: `picked id${outputReportId}/${outputPayloadSize}`,
      })
    }
    // Fallbacks only if primary fails
    for (const o of outs) {
      if (o.reportId === 8 && o.payloadSize === 16) continue
      attempts.push({
        id: o.reportId,
        data: padPayload(Uint8Array.from(wire17), o.payloadSize),
        label: `fallback id${o.reportId}/${o.payloadSize} full17`,
      })
      attempts.push({
        id: o.reportId,
        data: padPayload(toOemOutput16(wire17), o.payloadSize),
        label: `fallback id${o.reportId}/${o.payloadSize} data16`,
      })
    }

    let last: unknown
    for (const a of attempts) {
      try {
        await device.sendReport(a.id, a.data as BufferSource)
        outputReportId = a.id
        outputPayloadSize = a.data.length
        writePath = 'output'
        umdLog('webhid', 'info', 'sendReport ok', {
          label: a.label,
          id: a.id,
          size: a.data.length,
          pace,
          data: [...a.data],
        })
        // First report is often a dongle-local echo (status=1). Give the RF
        // path a short window for a follow-up before we continue.
        const ack = await waitInputReport({ timeoutMs: bulk ? 280 : 800 })
        lastAck = ack
        if (!ack) {
          umdLog(
            'webhid',
            'warn',
            bulk ? 'no ack within 280ms (continuing)' : 'no ack within 800ms (continuing)',
          )
        } else if (!ackLooksLive(ack)) {
          const follow = await waitInputReport({
            timeoutMs: bulk ? 90 : 120,
          })
          if (follow) {
            lastAck = follow
            umdLog('webhid', 'info', 'follow-up report after echo', {
              data: [...follow].slice(0, 17),
            })
          }
        }
        await sleep(bulk ? 2 : 16)
        return true
      } catch (e) {
        last = e
        umdLog('webhid', 'warn', 'sendReport try failed', {
          label: a.label,
          err: e instanceof Error ? e.message : String(e),
        })
      }
    }
    umdLog('webhid', 'warn', 'sendReport exhausted', {
      last: last instanceof Error ? last.message : String(last),
    })
    return false
  }

  async function tryFeature(reportId: number, data: Uint8Array): Promise<boolean> {
    if (!device?.opened) return false
    const id = reportId || featureReportId
    const sizes = [...new Set([featurePayloadSize, 19, 16, 17, 31, 63, 64])]
    let last: unknown
    for (const size of sizes) {
      try {
        const payload = padPayload(Uint8Array.from(data), size)
        await device.sendFeatureReport(id, payload as BufferSource)
        featurePayloadSize = size
        writePath = 'feature'
        umdLog('webhid', 'info', 'sendFeature ok', { id, size })
        return true
      } catch (e) {
        last = e
      }
    }
    umdLog('webhid', 'warn', 'sendFeature exhausted', {
      last: last instanceof Error ? last.message : String(last),
    })
    return false
  }

  return {
    kind: 'webhid',
    label: 'WebHID',
    getDeviceInfo() {
      if (!device) return null
      return {
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName || undefined,
        featureReportId,
        featurePayloadSize,
        outputReportId,
        outputPayloadSize,
        writePath: writePath ?? undefined,
      }
    },
    getLastAck() {
      return lastAck
    },
    async connect() {
      await this.connectPreferred()
    },
    async connectPreferred(productId?: number) {
      const hid = assertWebHid()
      const existing = (await hid.getDevices())
        .filter((d) => isOemHidUsbDevice(d.vendorId, d.productId))
        .sort((a, b) => scoreDevice(b) - scoreDevice(a))

      let selected =
        productId != null
          ? existing.find((d) => d.productId === productId) ??
            // Prefer same OEM family (King vs Blitz) when productId is known
            existing.find((d) =>
              productId != null && isBlitzUltimateDevice(0x3554, productId)
                ? isBlitzUltimateDevice(d.vendorId, d.productId)
                : isKingUltraDevice(d.vendorId, d.productId),
            ) ??
            existing[0]
          : existing[0]

      if (!selected) {
        const filters =
          productId != null && isBlitzUltimateDevice(0x3554, productId)
            ? blitzUltimateHidFilters()
            : productId != null && isKingUltraDevice(0x3554, productId)
              ? hidFilters()
              : oemHidUsbFilters()
        const picked = await hid.requestDevice({ filters })
        const ranked = [...picked]
          .filter((d) => isOemHidUsbDevice(d.vendorId, d.productId))
          .sort((a, b) => scoreDevice(b) - scoreDevice(a))
        selected =
          productId != null
            ? ranked.find((d) => d.productId === productId) ?? ranked[0]
            : ranked[0]
      }
      if (!selected) {
        throw new Error(
          'OEM HIDUsb mouse (King Ultra / Blitz Ultimate) nie jest podłączona / nie wybrano jej w oknie HID',
        )
      }
      await openSelected(selected)
    },
    async disconnect() {
      if (device?.opened) await device.close()
      device = null
      writePath = null
    },
    isConnected() {
      return Boolean(device?.opened)
    },
    async sendFeature(reportId, data, outputData?, pace = 'default') {
      if (!device?.opened) throw new Error('WebHID device not open')
      const wire =
        outputData && outputData.length > 0
          ? Uint8Array.from(outputData)
          : toOemWire17(Uint8Array.from(data))

      // Serialize writes - OEM queue is strictly one-in-flight
      const run = writeChain.then(async () => {
        if (await tryOemOutput(wire, pace)) return
        if (await tryFeature(reportId, data)) return
        throw new Error(
          'HID write failed. Need Output report id=8 (16 bytes) on the 8K receiver.',
        )
      })
      writeChain = run.catch(() => undefined)
      await run
    },
    async receiveFeature(reportId) {
      if (!device?.opened) throw new Error('WebHID device not open')
      const view = await device.receiveFeatureReport(reportId || featureReportId)
      return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
    },
    waitInput(opts) {
      return waitInputReport(opts)
    },
    onDisconnect(cb) {
      disconnectListeners.add(cb)
      return () => disconnectListeners.delete(cb)
    },
  }
}

export function webHidSupported(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.hid)
}
