import { umdLog } from '@/debug/umdLog'
import type { Transport } from '@/transport/types'
import type {
  ButtonAction,
  DeviceState,
  Macro,
  SensorState,
  SettingsState,
} from '../../../types'
import { createDefaultState, DPI_MAX_STAGES } from './defaults'
import {
  decodeDpi3950,
  decodeInputReport,
  decodeLongRangeReport,
  decodeVersionReport,
  dpiStageFlashBytes,
  encodeCommand,
  encodeSensorFlagWrites,
  encodeWriteFlashByte,
  FlashAddr,
  flashBytesMatch,
  hzToReportRateCode,
  keyFunFlashBytes,
  lodCodeToMm,
  lodMmToCode,
  pairChecksum,
  peakCodeToMinutes,
  peakTimeoutToCode,
  reportRateCodeToHz,
  sensorModeFromCode,
  sensorModeToCode,
  setDongleOnline,
  sleepCodeToMinutes,
  sleepMinutesToCode,
  UsbCommandId,
  type ProtocolCommand,
} from './protocol'
import { DEMO_BUTTONS, DEMO_IDENTITY } from '../../demo/identity'
import type { DeviceIdentity } from '../../../types'
import {
  actionToKeyFun,
  keyFunToAction,
  kingUltraKeyFunSlots,
  KING_ULTRA_BUTTONS,
  KING_ULTRA_BUTTON_ACTIONS,
} from './buttons'
import { KING_ULTRA_IDENTITY } from './identity'
import {
  encodeMacroKeyWrite,
  macroKeyFunParams,
} from './macroFlash'
import {
  encodeClearShortcutWrite,
  encodeMediaShortcutWrite,
  getKingAction,
} from './actions'

/** King Ultra dongle PIDs for connection label. */
const DONGLE_PRODUCT_IDS = [0xf54f, 0xf510]

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

export type DeviceWritePhase = 'idle' | 'queued' | 'writing' | 'ok' | 'error'

const DPI_DEBOUNCE_MS = 220
const SENSOR_DEBOUNCE_MS = 220

export class KingUltraDriver {
  private _identity: DeviceIdentity
  private state: DeviceState
  private transport: Transport | null = null

  get identity(): DeviceIdentity {
    return this._identity
  }
  lastWriteError: string | null = null
  lastWriteOk = false
  /** Last flash read-back / online probe result for UI. */
  lastVerifyNote: string | null = null
  mouseReachable = false
  writePhase: DeviceWritePhase = 'idle'
  private writePhaseListeners = new Set<(p: DeviceWritePhase) => void>()
  private dpiWriteTimer: ReturnType<typeof setTimeout> | null = null
  private pendingDpi: { stageIndex: number; value: number } | null = null
  private sensorWriteTimer: ReturnType<typeof setTimeout> | null = null
  private pendingSensorPatch: Partial<SensorState> | null = null
  private writeChain: Promise<void> = Promise.resolve()

  constructor() {
    this._identity = KING_ULTRA_IDENTITY
    this.state = createDefaultState()
  }

  /** Button action catalog for Buttons UI - King Ultra only. */
  get buttonActions() {
    return KING_ULTRA_BUTTON_ACTIONS
  }

  getState(): DeviceState {
    return this.state
  }

  onWritePhase(cb: (phase: DeviceWritePhase) => void): () => void {
    this.writePhaseListeners.add(cb)
    return () => {
      this.writePhaseListeners.delete(cb)
    }
  }

  private setWritePhase(phase: DeviceWritePhase) {
    this.writePhase = phase
    for (const cb of this.writePhaseListeners) cb(phase)
  }

  setTransport(transport: Transport) {
    this.transport = transport
  }

  async attach(transport: Transport) {
    this.transport = transport
    await transport.connect()
    const base = createDefaultState()
    this.state = {
      ...base,
      info: {
        ...base.info,
        connection: transport.kind === 'mock' ? 'wireless' : 'unknown',
        charging: transport.kind === 'mock',
        batteryPercent: transport.kind === 'mock' ? 42 : null,
        receiverFirmware: transport.kind === 'mock' ? 'v2.15' : '-',
        mouseFirmware: transport.kind === 'mock' ? 'v2.18' : '-',
      },
    }
    // CLI probe (tools/king_ultra_hid_probe.py): OR 0x80 into dataLen makes the
    // 8K dongle return status=1 empty echoes; WITHOUT 0x80 encryption returns a
    // real challenge response and Read/WriteFlash round-trip works.
    // Keep online-bit OFF until we prove an 0x80 path is live on this firmware.
    setDongleOnline(false)
    if (transport.kind === 'webhid' && 'getDeviceInfo' in transport) {
      const info = (
        transport as Transport & {
          getDeviceInfo?: () => { productId?: number } | null
        }
      ).getDeviceInfo?.()
      if (info?.productId != null) {
        const dongle = DONGLE_PRODUCT_IDS.includes(info.productId)
        this.state = {
          ...this.state,
          info: {
            ...this.state.info,
            connection: dongle ? 'wireless' : 'corded',
          },
        }
      }
    } else if (transport.kind === 'mock') {
      this.mouseReachable = true
    }

    // Demo transport → fictional UMD mouse art (King host only).
    if (transport.kind === 'mock' && true) {
      this._identity = DEMO_IDENTITY
      this.state = {
        ...this.state,
        buttons: DEMO_BUTTONS.map((b) => ({ ...b })),
        info: {
          ...this.state.info,
          driveVersion: '0.1.0-demo',
        },
      }
    } else {
      this._identity = KING_ULTRA_IDENTITY
      this.state = {
        ...this.state,
        buttons: KING_ULTRA_BUTTONS.map((b) => ({ ...b })),
      }
    }

    // OEM UsbServer_Start → encryption + PC driver. Heavy flash sync is separate
    // so the UI can open immediately after attach.
    await this.trySend({ op: 'read_encryption' })
    await this.trySend({ op: 'set_pc_driver', active: true })
    await this.refreshBatteryQuick()
  }

  /** Fast path: online + battery only (no FW / flash map). */
  async refreshBatteryQuick() {
    await this.trySend({ op: 'read_online' })
    await this.trySend({ op: 'read_info' })
    const ack = this.readLastAck()
    if (!ack) {
      umdLog('driver', 'warn', 'no battery/online ack')
      return
    }
    const parsed = decodeInputReport(ack)
    umdLog('driver', 'info', 'device info ack', parsed)
    if (!parsed) return
    const hasBat =
      parsed.commandId === 4 &&
      (parsed.batteryPercent != null ||
        (parsed.batVoltage != null && parsed.batVoltage > 0))
    if (hasBat && parsed.batVoltage && parsed.batVoltage > 0) {
      this.mouseReachable = true
      this.state = {
        ...this.state,
        info: {
          ...this.state.info,
          batteryPercent: parsed.batteryPercent ?? null,
          charging: Boolean(parsed.charging),
        },
      }
    } else if (parsed.commandId === 4) {
      umdLog(
        'driver',
        'warn',
        'battery ack empty - dongle echo only; move mouse / wake it',
      )
    }
  }

  async refreshDeviceInfo() {
    await this.refreshBatteryQuick()
    await this.refreshFirmwareVersions()
    await this.refreshSleepFromDevice()
    await this.refreshLongDistanceFromDevice()
  }

  /** OEM PowerSaveTime → allLedOffTime @ 0xAD. */
  async refreshSleepFromDevice() {
    if (!this.transport || this.transport.kind === 'mock') return
    const got = await this.readFlashPayload(FlashAddr.allLedOffTime, 2)
    if (!got || got.length < 1) return
    const code = got[0] & 0xff
    if (code === 0) return
    const minutes = sleepCodeToMinutes(code)
    this.state = {
      ...this.state,
      settings: { ...this.state.settings, sleepAfterMin: minutes },
    }
    umdLog('driver', 'info', 'sleep from flash', { code, minutes })
  }

  /**
   * OEM GetLongRangeMode (cmd 23) - not in MouseConfig flash; must poll USB.
   * Without this, UI resets to default false after reconnect.
   */
  async refreshLongDistanceFromDevice(): Promise<boolean | null> {
    if (!this.transport || this.transport.kind === 'mock') return null
    await this.trySend({ op: 'set_pc_driver', active: true })
    await this.trySend({ op: 'read_online' })
    await sleep(40)
    const enabled = await this.readLongDistanceOnce()
    if (enabled == null) return null
    this.state = {
      ...this.state,
      settings: { ...this.state.settings, longDistance: enabled },
    }
    umdLog('driver', 'info', 'long distance from device', { enabled })
    return enabled
  }

  private async readLongDistanceOnce(): Promise<boolean | null> {
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.trySend({ op: 'get_long_distance' })
      const ack = this.readLastAck()
      let parsed = ack ? decodeLongRangeReport(ack) : null
      if (parsed != null) return parsed

      const wait = this.transport?.waitInput
      if (wait) {
        for (let i = 0; i < 8 && parsed == null; i++) {
          const next = await wait.call(this.transport, {
            commandId: UsbCommandId.GetLongRangeMode,
            timeoutMs: 450,
          })
          if (!next) continue
          parsed = decodeLongRangeReport(next)
        }
      }
      if (parsed != null) return parsed
      await sleep(40)
    }
    return null
  }

  /** Full post-connect sync: bulk flash map + firmware versions. */
  async syncFromDevice() {
    await this.probeFlashAndSync()
    await this.refreshFirmwareVersions()
  }

  /**
   * Live F54F mapping (matches OEM Settings labels):
   * - cmd 0xB3 → Receiver Firmware (UsbFinder_GetSlaveVersion wire)
   * - cmd 0x12 → Mouse Firmware (UsbServer_ReadVersion)
   */
  async refreshFirmwareVersions() {
    if (!this.transport || this.transport.kind === 'mock') return

    await this.trySend({ op: 'set_pc_driver', active: true })
    await this.trySend({ op: 'read_online' })
    await sleep(60)

    const receiver = await this.readVersionOnce(
      'read_dongle_version',
      UsbCommandId.GetDongleVersion,
    )
    await this.trySend({ op: 'read_online' })
    await sleep(40)
    const mouse = await this.readVersionOnce(
      'read_mouse_version',
      UsbCommandId.ReadVersionID,
    )
    umdLog('driver', 'info', 'firmware versions', { receiver, mouse })

    if (!receiver && !mouse) return
    this.state = {
      ...this.state,
      info: {
        ...this.state.info,
        receiverFirmware: receiver ?? this.state.info.receiverFirmware,
        mouseFirmware: mouse ?? this.state.info.mouseFirmware,
      },
    }
    if (mouse) this.mouseReachable = true
  }

  private async readVersionOnce(
    op: 'read_dongle_version' | 'read_mouse_version' | 'read_version',
    expectCmd: number,
  ): Promise<string | null> {
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.trySend({ op })
      let ack = this.readLastAck()
      let ver = ack ? decodeVersionReport(ack, expectCmd) : null
      if (ver) return ver.firmware

      // Dongle may echo first (status=1 / wrong cmd). Keep listening for match.
      const wait = this.transport?.waitInput
      if (wait) {
        for (let i = 0; i < 8 && !ver; i++) {
          const next = await wait.call(this.transport, {
            commandId: expectCmd,
            timeoutMs: 450,
          })
          if (!next) continue
          ver = decodeVersionReport(next, expectCmd)
          if (ver) return ver.firmware
        }
      } else {
        await sleep(120)
        ack = this.readLastAck()
        ver = ack ? decodeVersionReport(ack, expectCmd) : null
        if (ver) return ver.firmware
      }
      await sleep(80)
    }
    return null
  }

  /**
   * OEM ReadAllFlashData = ReadFalshData(0, 0xC0, allFlag=1) in 10-byte chunks.
   * One map read replaces dozens of tiny probes.
   */
  private async readFlashMap(total = 0xc0): Promise<Uint8Array | null> {
    const map = new Uint8Array(total)
    let filled = 0
    const t0 = performance.now()

    // OEM ReadAllFlashData → ReadFalshData(0, 0xC0, allFlag=1) in ≤10 B chunks.
    for (let addr = 0; addr < total; addr += 10) {
      const len = Math.min(10, total - addr)
      const r = await this.trySend(
        {
          op: 'read_flash',
          address: addr,
          length: len,
          allFlag: 1,
        },
        'bulk',
      )
      if (!r.applied) continue
      const ack = this.readLastAck()
      if (!ack) continue
      const parsed = decodeInputReport(ack)
      if (!parsed || parsed.commandId !== 8) continue
      const at = parsed.address & 0xffff
      if (at >= total) continue
      const n = Math.min(len, parsed.payload.length, total - at)
      if (n <= 0) continue
      map.set(parsed.payload.subarray(0, n), at)
      filled += n
    }

    umdLog('driver', 'info', 'flash map read', {
      filled,
      total,
      ms: Math.round(performance.now() - t0),
    })
    return filled > 0 ? map : null
  }

  private sliceMap(
    map: Uint8Array,
    address: number,
    length: number,
  ): Uint8Array {
    return map.subarray(address, Math.min(map.length, address + length))
  }

  async probeFlashAndSync() {
    if (!this.transport || this.transport.kind === 'mock') return

    await this.trySend({ op: 'set_pc_driver', active: true })

    const map = await this.readFlashMap(0xc0)
    if (!map) {
      this.lastVerifyNote =
        'Dongle OK, mouse flash unreachable (wake mouse / move it, close OEM app, retry)'
      this.lastWriteOk = false
      umdLog('driver', 'error', this.lastVerifyNote)
      return
    }

    const ratePayload = this.sliceMap(map, FlashAddr.reportRate, 2)
    const maxDpiPayload = this.sliceMap(map, FlashAddr.maxDpi, 2)
    const dpiIdxPayload = this.sliceMap(map, FlashAddr.currentDpi, 2)
    const stage0 = this.sliceMap(map, FlashAddr.dpiStage0, 4)

    const live =
      ratePayload.some((b) => b !== 0) ||
      (maxDpiPayload[0] & 0xff) > 0 ||
      dpiIdxPayload.some((b) => b !== 0) ||
      stage0.some((b) => b !== 0)

    this.mouseReachable = live
    if (!live) {
      this.lastVerifyNote =
        'Dongle OK, mouse flash unreachable (wake mouse / move it, close OEM app, retry)'
      this.lastWriteOk = false
      umdLog('driver', 'error', this.lastVerifyNote)
      return
    }

    let sensor = { ...this.state.sensor }

    const hz = reportRateCodeToHz(ratePayload[0] & 0xff)
    if (hz != null) sensor = { ...sensor, reportRate: hz }

    const count = Math.min(
      DPI_MAX_STAGES,
      Math.max(1, maxDpiPayload[0] & 0xff),
    )
    let dpiStages = sensor.dpiStages.map((s) => ({
      ...s,
      enabled: s.index < count,
    }))
    let activeDpiIndex = sensor.activeDpiIndex
    if (activeDpiIndex >= count) activeDpiIndex = count - 1
    sensor = { ...sensor, dpiStageCount: count, dpiStages, activeDpiIndex }

    const idx = dpiIdxPayload[0] & 0xff
    if (idx < sensor.dpiStageCount) {
      sensor = { ...sensor, activeDpiIndex: idx }
    }

    for (let i = 0; i < sensor.dpiStageCount; i++) {
      const raw = this.sliceMap(map, FlashAddr.dpiStage0 + i * 4, 4)
      if (raw.length >= 3 && raw.some((b) => b !== 0)) {
        const value = decodeDpi3950(raw[0], raw[2])
        dpiStages = dpiStages.map((s) =>
          s.index === i ? { ...s, value, enabled: true } : s,
        )
      }
    }
    sensor = { ...sensor, dpiStages }

    const lodRaw = this.sliceMap(map, FlashAddr.silenceHeight, 2)
    sensor = { ...sensor, lodMm: lodCodeToMm(lodRaw[0] & 0xff) }

    const modeRaw = this.sliceMap(map, FlashAddr.sensorPowerSavingEnable, 2)
    sensor = { ...sensor, mode: sensorModeFromCode(modeRaw[0] & 0xff) }

    sensor = {
      ...sensor,
      motionSync:
        (this.sliceMap(map, FlashAddr.motionSyncEnable, 1)[0] & 0xff) !== 0,
      angleSnapping:
        (this.sliceMap(map, FlashAddr.linearCorrectionEnable, 1)[0] & 0xff) !==
        0,
      rippleControl:
        (this.sliceMap(map, FlashAddr.rippleControlEnable, 1)[0] & 0xff) !== 0,
    }

    const peakEn = this.sliceMap(map, FlashAddr.sensorCustomSleepEnable, 1)[0]
    const peakTime = this.sliceMap(map, FlashAddr.sensorSleepTime, 1)[0]
    sensor = {
      ...sensor,
      peakPerformance: (peakEn & 0xff) !== 0,
      ...(peakTime > 0
        ? { peakPerformanceTimeoutMin: peakCodeToMinutes(peakTime & 0xff) }
        : {}),
    }

    const debounceMs = this.sliceMap(map, FlashAddr.keyDebounceTime, 1)[0] & 0xff
    sensor = {
      ...sensor,
      debounceMs: debounceMs === 0 ? sensor.debounceMs || 8 : debounceMs,
      debounceEnabled: debounceMs > 0,
    }

    const sleepRaw =
      this.sliceMap(map, FlashAddr.allLedOffTime, 1)[0] & 0xff
    const settings = {
      ...this.state.settings,
      ...(sleepRaw > 0
        ? { sleepAfterMin: sleepCodeToMinutes(sleepRaw) }
        : {}),
    }

    let buttons = this.state.buttons.map((b) => ({ ...b }))
    for (const b of buttons) {
      const raw = this.sliceMap(map, FlashAddr.keyFun0 + b.flashIndex * 4, 4)
      if (raw.length >= 3 && !raw.every((x) => x === 0)) {
        const action = keyFunToAction(raw[0], raw[1], raw[2])
        buttons = buttons.map((x) =>
          x.id === b.id ? { ...x, action } : x,
        )
      }
    }

    this.state = { ...this.state, sensor, buttons, settings }
    this.lastVerifyNote = `Mouse flash synced (stages=${sensor.dpiStageCount}, ${sensor.reportRate}Hz)`
    this.lastWriteOk = true
    umdLog('driver', 'info', 'probeFlashAndSync done', {
      dpiStageCount: sensor.dpiStageCount,
      reportRate: sensor.reportRate,
      activeDpiIndex: sensor.activeDpiIndex,
      lodMm: sensor.lodMm,
      mode: sensor.mode,
      debounceMs: sensor.debounceMs,
      debounceEnabled: sensor.debounceEnabled,
      buttons: buttons.map((b) => ({ id: b.id, action: b.action })),
    })

    // Long range is a live USB flag (cmd 22/23), not a flash cell.
    await this.refreshLongDistanceFromDevice()
  }

  /**
   * Poll active DPI index + report rate without a full flash map sync.
   * Used while Sensor page is open so DPI Loop / Hz Switch on the mouse update the UI.
   */
  async refreshLiveSensorFromDevice(): Promise<boolean> {
    if (!this.transport || this.transport.kind === 'mock') return false
    if (this.writePhase === 'writing' || this.writePhase === 'queued') return false

    const dpiRaw = await this.readFlashPayload(FlashAddr.currentDpi, 2)
    const rateRaw = await this.readFlashPayload(FlashAddr.reportRate, 2)

    let sensor = { ...this.state.sensor }
    let changed = false

    if (dpiRaw && dpiRaw.length >= 1) {
      const idx = dpiRaw[0]! & 0xff
      if (
        idx < sensor.dpiStageCount &&
        idx !== sensor.activeDpiIndex
      ) {
        sensor = { ...sensor, activeDpiIndex: idx }
        changed = true
        umdLog('driver', 'info', 'live DPI stage from mouse', { idx })
      }
    }

    if (rateRaw && rateRaw.length >= 1) {
      const hz = reportRateCodeToHz(rateRaw[0]! & 0xff)
      if (hz != null && hz !== sensor.reportRate) {
        sensor = { ...sensor, reportRate: hz }
        changed = true
        umdLog('driver', 'info', 'live report rate from mouse', { hz })
      }
    }

    if (changed) {
      this.state = { ...this.state, sensor }
    }
    return changed
  }

  private readLastAck(): Uint8Array | null {
    const t = this.transport as Transport & {
      getLastAck?: () => Uint8Array | null
    }
    return t?.getLastAck?.() ?? null
  }

  private async readFlashPayload(
    address: number,
    length: number,
  ): Promise<Uint8Array | null> {
    const r = await this.trySend({ op: 'read_flash', address, length })
    if (!r.applied) return null
    const ack = this.readLastAck()
    if (!ack) return null
    const parsed = decodeInputReport(ack)
    if (!parsed || parsed.commandId !== 8) {
      umdLog('driver', 'warn', 'read_flash unexpected ack', parsed)
      return null
    }
    return parsed.payload
  }

  private async verifyDpiStage(
    stageIndex: number,
    dpi: number,
  ): Promise<boolean> {
    const expect = dpiStageFlashBytes(dpi)
    const addr = FlashAddr.dpiStage0 + stageIndex * 4
    for (let attempt = 0; attempt < 4; attempt++) {
      const got = await this.readFlashPayload(addr, 4)
      umdLog('driver', 'info', 'dpi verify', {
        attempt,
        addr,
        expect,
        got: got ? [...got] : null,
      })
      if (got && flashBytesMatch(got, expect, 4)) {
        this.mouseReachable = true
        return true
      }
      await sleep(120)
    }
    return false
  }

  private async verifyFlashByte(
    address: number,
    value: number,
  ): Promise<boolean> {
    const expect = [value & 0xff, pairChecksum(value)]
    for (let attempt = 0; attempt < 4; attempt++) {
      const got = await this.readFlashPayload(address, 2)
      umdLog('driver', 'info', 'byte verify', {
        attempt,
        address,
        expect,
        got: got ? [...got] : null,
      })
      // Dongle echo is all-zero; real flash has value + pair checksum.
      if (
        got &&
        got.length >= 2 &&
        (got[0] & 0xff) === expect[0] &&
        (got[1] & 0xff) === expect[1]
      ) {
        this.mouseReachable = true
        return true
      }
      await sleep(120)
    }
    return false
  }

  async detach() {
    if (this.transport) {
      await this.trySend({ op: 'set_pc_driver', active: false })
    }
    await this.transport?.disconnect()
    this.transport = null
  }

  private async trySend(
    cmd: ProtocolCommand,
    pace: 'default' | 'bulk' = 'default',
  ) {
    const encoded = encodeCommand(cmd)
    if (!encoded || !this.transport) {
      this.lastWriteOk = false
      if (!encoded) this.lastWriteError = `No encode for ${cmd.op}`
      return { applied: false as const }
    }
    try {
      await this.transport.sendFeature(
        encoded.reportId,
        encoded.data,
        encoded.outputData,
        pace,
      )
      this.lastWriteOk = true
      this.lastWriteError = null
      umdLog('driver', 'info', 'wrote', cmd.op, {
        wire17: [...encoded.outputData],
        feature19: [...encoded.data].slice(0, 12),
      })
      return { applied: true as const }
    } catch (err) {
      this.lastWriteOk = false
      this.lastWriteError = err instanceof Error ? err.message : String(err)
      umdLog('driver', 'error', 'write failed', cmd.op, this.lastWriteError)
      return { applied: false as const }
    }
  }

  private async trySendAll(
    reports: { reportId: number; data: Uint8Array; outputData?: Uint8Array }[],
    pace: 'default' | 'bulk' = 'default',
  ) {
    if (!this.transport || reports.length === 0) return { applied: false as const }
    let ok = true
    for (const r of reports) {
      try {
        await this.transport.sendFeature(
          r.reportId,
          r.data,
          r.outputData,
          pace,
        )
      } catch (err) {
        ok = false
        this.lastWriteOk = false
        this.lastWriteError = err instanceof Error ? err.message : String(err)
        console.error('[driver] write failed', this.lastWriteError)
      }
    }
    if (ok) {
      this.lastWriteOk = true
      this.lastWriteError = null
    }
    return { applied: ok as boolean }
  }

  setProfile(index: number) {
    this.state = { ...this.state, profileIndex: index }
  }

  setButtonAction(
    buttonId: number,
    action: ButtonAction,
    macroId?: string,
  ): Promise<void> {
    const button = this.state.buttons.find((b) => b.id === buttonId)
    if (!button) return Promise.resolve()
    const resolvedMacroId =
      action === 'macro'
        ? (macroId ??
            button.macroId ??
            this.state.macros[0]?.id)
        : undefined
    const macro =
      action === 'macro' && resolvedMacroId
        ? this.state.macros.find((m) => m.id === resolvedMacroId)
        : undefined
    const fun =
      action === 'macro' && macro
        ? macroKeyFunParams(button.flashIndex, macro)
        : action === 'macro'
          ? {
              type: 0x06,
              param1: button.flashIndex,
              param2: 254,
            }
          : actionToKeyFun(action)
    const keySlots = kingUltraKeyFunSlots(buttonId, button.flashIndex)
    this.state = {
      ...this.state,
      buttons: this.state.buttons.map((b) =>
        b.id === buttonId
          ? {
              ...b,
              action,
              macroId: action === 'macro' ? resolvedMacroId : undefined,
            }
          : b,
      ),
    }
    this.setWritePhase('queued')
    return this.enqueueWrite(async () => {
      umdLog('driver', 'info', 'flush button', {
        buttonId,
        flashIndex: button.flashIndex,
        keySlots,
        action,
        macroId: resolvedMacroId,
        fun,
      })
      await this.trySend({ op: 'set_pc_driver', active: true })
      if (action === 'macro' && macro) {
        for (const slot of keySlots) {
          const chunks = encodeMacroKeyWrite(slot, macro)
          await this.trySendAll(chunks, 'bulk')
          await sleep(40)
        }
      }
      const actionDef = getKingAction(action)
      if (actionDef?.mediaUsage) {
        const [lo, hi] = actionDef.mediaUsage
        for (const slot of keySlots) {
          await this.trySendAll(
            encodeMediaShortcutWrite(slot, lo, hi),
            'bulk',
          )
          await sleep(20)
        }
      } else if (action !== 'macro' && action !== 'combo') {
        for (const slot of keySlots) {
          await this.trySendAll(encodeClearShortcutWrite(slot), 'bulk')
        }
        await sleep(20)
      }
      for (const slot of keySlots) {
        const slotFun =
          action === 'macro' && macro
            ? macroKeyFunParams(slot, macro)
            : action === 'macro'
              ? {
                  type: 0x06,
                  param1: slot,
                  param2: 254,
                }
              : fun
        await this.trySend({
          op: 'set_button',
          flashIndex: slot,
          type: slotFun.type,
          param1: slotFun.param1,
          param2: slotFun.param2,
        })
      }
      if (this.transport?.kind === 'webhid') {
        let ok = true
        for (const slot of keySlots) {
          const slotFun =
            action === 'macro' && macro
              ? macroKeyFunParams(slot, macro)
              : action === 'macro'
                ? {
                    type: 0x06,
                    param1: slot,
                    param2: 254,
                  }
                : fun
          const slotOk = await this.verifyKeyFun(
            slot,
            slotFun.type,
            slotFun.param1,
            slotFun.param2,
          )
          if (!slotOk) ok = false
        }
        this.lastWriteOk = ok
        this.lastVerifyNote = ok
          ? `Button ${buttonId} → ${action} verified (${keySlots.map((s) => `0x${s.toString(16)}`).join(',')})`
          : `Button ${buttonId} NOT in flash - wake mouse`
        if (!ok) this.lastWriteError = this.lastVerifyNote
      }
    })
  }

  private async verifyKeyFun(
    flashIndex: number,
    type: number,
    param1: number,
    param2: number,
  ): Promise<boolean> {
    const expect = keyFunFlashBytes(type, param1, param2)
    const addr = FlashAddr.keyFun0 + flashIndex * 4
    for (let attempt = 0; attempt < 4; attempt++) {
      const got = await this.readFlashPayload(addr, 4)
      umdLog('driver', 'info', 'keyfun verify', {
        attempt,
        addr,
        expect,
        got: got ? [...got] : null,
      })
      if (got && flashBytesMatch(got, expect, 4)) return true
      await sleep(120)
    }
    return false
  }

  /**
   * UI-instant sensor patch. HID writes are debounced so sliders stay smooth.
   */
  patchSensor(patch: Partial<SensorState>) {
    this.state = { ...this.state, sensor: { ...this.state.sensor, ...patch } }
    this.pendingSensorPatch = { ...this.pendingSensorPatch, ...patch }
    this.setWritePhase('queued')
    if (this.sensorWriteTimer) clearTimeout(this.sensorWriteTimer)
    this.sensorWriteTimer = setTimeout(() => {
      this.sensorWriteTimer = null
      const pending = this.pendingSensorPatch
      this.pendingSensorPatch = null
      if (pending) this.enqueueWrite(() => this.flushSensorPatch(pending))
    }, SENSOR_DEBOUNCE_MS)
  }

  private async flushSensorPatch(patch: Partial<SensorState>) {
    umdLog('driver', 'info', 'flush sensor', patch)
    await this.trySend({ op: 'set_pc_driver', active: true })

    const notes: string[] = []
    let allOk = true
    const webhid = this.transport?.kind === 'webhid'

    const verify = async (address: number, value: number, label: string) => {
      if (!webhid) return
      const ok = await this.verifyFlashByte(address, value)
      if (ok) notes.push(label)
      else {
        allOk = false
        this.lastWriteError = `${label} NOT in flash - wake mouse / close OEM`
        umdLog('driver', 'error', this.lastWriteError, { address, value })
      }
    }

    if (patch.dpiStageCount != null) {
      const count = this.state.sensor.dpiStageCount
      await this.trySend({ op: 'set_dpi_stage_count', count })
      await verify(FlashAddr.maxDpi, count, `stages=${count}`)
    }
    if (patch.reportRate != null) {
      const code = hzToReportRateCode(patch.reportRate)
      await this.trySend({ op: 'set_report_rate', hz: patch.reportRate })
      if (code != null) {
        await verify(FlashAddr.reportRate, code, `${patch.reportRate}Hz`)
      }
    }
    if (patch.activeDpiIndex != null) {
      await this.trySend({
        op: 'set_active_dpi',
        stageIndex: patch.activeDpiIndex,
      })
      await verify(
        FlashAddr.currentDpi,
        patch.activeDpiIndex,
        `dpiIdx=${patch.activeDpiIndex}`,
      )
    }
    if (patch.debounceMs != null || patch.debounceEnabled != null) {
      const enabled = this.state.sensor.debounceEnabled
      let ms = this.state.sensor.debounceMs & 0xff
      // Turning on with 0ms → restore OEM default 8ms
      if (enabled && ms === 0) {
        ms = 8
        this.state = {
          ...this.state,
          sensor: { ...this.state.sensor, debounceMs: ms },
        }
      }
      const flashMs = enabled ? ms : 0
      await this.trySend({
        op: 'set_debounce',
        ms,
        enabled,
      })
      await verify(
        FlashAddr.keyDebounceTime,
        flashMs,
        enabled ? `debounce=${ms}ms` : 'debounce=off',
      )
    }
    if (
      patch.rippleControl != null ||
      patch.angleSnapping != null ||
      patch.motionSync != null
    ) {
      const flags = {
        ripple: this.state.sensor.rippleControl,
        angle: this.state.sensor.angleSnapping,
        motionSync: this.state.sensor.motionSync,
      }
      await this.trySendAll(encodeSensorFlagWrites(flags))
      await verify(
        FlashAddr.motionSyncEnable,
        flags.motionSync ? 1 : 0,
        `motion=${flags.motionSync ? 1 : 0}`,
      )
      await verify(
        FlashAddr.linearCorrectionEnable,
        flags.angle ? 1 : 0,
        `angle=${flags.angle ? 1 : 0}`,
      )
      await verify(
        FlashAddr.rippleControlEnable,
        flags.ripple ? 1 : 0,
        `ripple=${flags.ripple ? 1 : 0}`,
      )
    }
    if (patch.lodMm != null) {
      const code = lodMmToCode(patch.lodMm)
      await this.trySend({ op: 'set_lod', mm: patch.lodMm })
      await verify(FlashAddr.silenceHeight, code, `lod=${patch.lodMm}`)
    }
    if (patch.mode != null) {
      const code = sensorModeToCode(patch.mode)
      await this.trySend({ op: 'set_sensor_mode', mode: patch.mode })
      await verify(FlashAddr.sensorPowerSavingEnable, code, `mode=${patch.mode}`)
    }
    if (patch.peakPerformance != null || patch.peakPerformanceTimeoutMin != null) {
      const enabled = this.state.sensor.peakPerformance
      const timeoutMin = this.state.sensor.peakPerformanceTimeoutMin
      await this.trySend({
        op: 'set_peak',
        enabled,
        timeoutMin,
      })
      await verify(
        FlashAddr.sensorCustomSleepEnable,
        enabled ? 1 : 0,
        `peak=${enabled ? 1 : 0}`,
      )
      if (enabled) {
        const tCode = peakTimeoutToCode(timeoutMin)
        await this.trySendAll([
          encodeWriteFlashByte(FlashAddr.sensorSleepTime, tCode),
        ])
        await verify(FlashAddr.sensorSleepTime, tCode, `peakTime=${timeoutMin}`)
      }
    }

    this.lastWriteOk = allOk
    this.lastVerifyNote = allOk
      ? notes.length
        ? `Verified: ${notes.join(', ')}`
        : 'Sensor write OK'
      : this.lastWriteError
    if (!allOk && this.lastVerifyNote) this.lastWriteError = this.lastVerifyNote
    umdLog('driver', allOk ? 'info' : 'error', this.lastVerifyNote)
  }

  setDpiStageCount(count: number) {
    const max = this.state.sensor.dpiStages.length
    const dpiStageCount = Math.min(max, Math.max(1, Math.round(count)))
    const dpiStages = this.state.sensor.dpiStages.map((s) => ({
      ...s,
      enabled: s.index < dpiStageCount,
    }))
    let activeDpiIndex = this.state.sensor.activeDpiIndex
    if (activeDpiIndex >= dpiStageCount) activeDpiIndex = dpiStageCount - 1
    this.state = {
      ...this.state,
      sensor: { ...this.state.sensor, dpiStages, dpiStageCount, activeDpiIndex },
    }
    // Same debounced + verified path as Hz / LOD / mode.
    this.patchSensor({ dpiStageCount, activeDpiIndex })
  }

  /** Instant UI; HID flush after debounce (does not block the caller). */
  setDpiStage(index: number, value: number) {
    const clamped = Math.min(
      30000,
      Math.max(50, Math.round(value / 50) * 50),
    )
    if (index < 0 || index >= this.state.sensor.dpiStageCount) return
    const dpiStages = this.state.sensor.dpiStages.map((s) =>
      s.index === index ? { ...s, value: clamped } : s,
    )
    this.state = {
      ...this.state,
      sensor: { ...this.state.sensor, dpiStages, activeDpiIndex: index },
    }
    this.pendingDpi = { stageIndex: index, value: clamped }
    this.setWritePhase('queued')
    if (this.dpiWriteTimer) clearTimeout(this.dpiWriteTimer)
    this.dpiWriteTimer = setTimeout(() => {
      this.dpiWriteTimer = null
      const pending = this.pendingDpi
      this.pendingDpi = null
      if (pending) this.enqueueWrite(() => this.flushDpi(pending))
    }, DPI_DEBOUNCE_MS)
  }

  private enqueueWrite(job: () => Promise<void>): Promise<void> {
    this.writeChain = this.writeChain
      .then(async () => {
        this.setWritePhase('writing')
        this.lastWriteError = null
        await job()
        if (this.lastWriteError) this.setWritePhase('error')
        else {
          this.lastWriteOk = true
          this.setWritePhase('ok')
        }
      })
      .catch((err) => {
        this.lastWriteOk = false
        this.lastWriteError = err instanceof Error ? err.message : String(err)
        this.setWritePhase('error')
        umdLog('driver', 'error', 'write queue failed', this.lastWriteError)
      })
    return this.writeChain
  }

  private async flushDpi(pending: { stageIndex: number; value: number }) {
    umdLog('driver', 'info', 'flush dpi', pending)
    await this.trySend({ op: 'set_pc_driver', active: true })
    await this.trySend({
      op: 'set_dpi',
      stageIndex: pending.stageIndex,
      value: pending.value,
    })
    await this.trySend({
      op: 'set_active_dpi',
      stageIndex: pending.stageIndex,
    })
    if (this.transport?.kind === 'webhid') {
      const stageOk = await this.verifyDpiStage(
        pending.stageIndex,
        pending.value,
      )
      const idxOk = await this.verifyFlashByte(
        FlashAddr.currentDpi,
        pending.stageIndex,
      )
      const ok = stageOk && idxOk
      this.lastWriteOk = ok
      this.lastVerifyNote = ok
        ? `DPI ${pending.value} verified in mouse flash`
        : 'DPI NOT in flash - wake mouse / close OEM software'
      if (!ok) this.lastWriteError = this.lastVerifyNote
      umdLog('driver', ok ? 'info' : 'error', this.lastVerifyNote, {
        stageOk,
        idxOk,
      })
    }
  }

  setMacros(macros: Macro[]) {
    this.state = { ...this.state, macros }
  }

  /** Write every button-assigned macro body + KeyFun type=6 to flash. */
  saveMacrosToDevice(): Promise<void> {
    this.setWritePhase('queued')
    return this.enqueueWrite(async () => {
      await this.trySend({ op: 'set_pc_driver', active: true })
      await this.trySend({ op: 'read_online' })
      await sleep(40)
      let wrote = 0
      for (const button of this.state.buttons) {
        if (button.action !== 'macro' || !button.macroId) continue
        const macro = this.state.macros.find((m) => m.id === button.macroId)
        if (!macro) continue
        const fun = macroKeyFunParams(button.flashIndex, macro)
        const chunks = encodeMacroKeyWrite(button.flashIndex, macro)
        umdLog('driver', 'info', 'flush macro slot', {
          buttonId: button.id,
          flashIndex: button.flashIndex,
          name: macro.name,
          events: macro.events.length,
          chunks: chunks.length,
          fun,
        })
        await this.trySendAll(chunks, 'bulk')
        await sleep(40)
        await this.trySend({
          op: 'set_button',
          flashIndex: button.flashIndex,
          type: fun.type,
          param1: fun.param1,
          param2: fun.param2,
        })
        if (button.id === 6) {
          for (const slot of kingUltraKeyFunSlots(6, button.flashIndex).slice(
            1,
          )) {
            await this.trySend({
              op: 'set_button',
              flashIndex: slot,
              type: fun.type,
              param1: fun.param1,
              param2: fun.param2,
            })
          }
        }
        if (this.transport?.kind === 'webhid') {
          const ok = await this.verifyKeyFun(
            button.flashIndex,
            fun.type,
            fun.param1,
            fun.param2,
          )
          if (!ok) {
            this.lastWriteOk = false
            this.lastVerifyNote = `Macro on button ${button.id} KeyFun NOT verified`
            this.lastWriteError = this.lastVerifyNote
            return
          }
        }
        wrote += 1
      }
      this.lastWriteOk = true
      this.lastVerifyNote =
        wrote > 0
          ? `Saved ${wrote} macro slot(s) to mouse flash`
          : 'No button has a macro assigned - assign from Buttons, then Save'
      umdLog('driver', 'info', this.lastVerifyNote)
    })
  }

  patchSettings(patch: Partial<SettingsState>): Promise<void> {
    this.state = { ...this.state, settings: { ...this.state.settings, ...patch } }
    this.setWritePhase('queued')
    return this.enqueueWrite(async () => {
      if (patch.sleepAfterMin != null) {
        const code = sleepMinutesToCode(patch.sleepAfterMin)
        // Same prelude as DPI flush - flash writes need PC-driver session + wake.
        await this.trySend({ op: 'set_pc_driver', active: true })
        await this.trySend({ op: 'read_online' })
        await sleep(40)
        await this.trySend({ op: 'set_sleep', minutes: patch.sleepAfterMin })
        if (this.transport?.kind === 'webhid') {
          const ok = await this.verifyFlashByte(FlashAddr.allLedOffTime, code)
          this.lastWriteOk = ok
          this.lastVerifyNote = ok
            ? `Sleep ${patch.sleepAfterMin} min verified in flash @0xAD (${code})`
            : 'Sleep NOT in flash - wake mouse / close OEM software'
          if (!ok) this.lastWriteError = this.lastVerifyNote
          umdLog('driver', ok ? 'info' : 'error', this.lastVerifyNote, {
            code,
            minutes: patch.sleepAfterMin,
          })
          if (ok) {
            // Re-sync UI from flash so dropdown matches OEM units.
            await this.refreshSleepFromDevice()
          }
        }
      }
      if (patch.longDistance != null) {
        // Same prelude as sleep - long-range needs PC-driver + online wake.
        await this.trySend({ op: 'set_pc_driver', active: true })
        await this.trySend({ op: 'read_online' })
        await sleep(40)
        await this.trySend({
          op: 'set_long_distance',
          enabled: patch.longDistance,
        })
        if (this.transport?.kind === 'webhid') {
          await sleep(60)
          const got = await this.readLongDistanceOnce()
          const ok = got === patch.longDistance
          this.lastWriteOk = ok
          this.lastVerifyNote = ok
            ? `Long distance ${patch.longDistance ? 'ON' : 'OFF'} verified (GetLongRangeMode)`
            : `Long distance NOT applied (readback=${got}) - wake mouse / close OEM`
          if (!ok) this.lastWriteError = this.lastVerifyNote
          umdLog('driver', ok ? 'info' : 'error', this.lastVerifyNote, {
            want: patch.longDistance,
            got,
          })
          if (got != null) {
            this.state = {
              ...this.state,
              settings: { ...this.state.settings, longDistance: got },
            }
          }
        }
      }
    })
  }

  /** After draft merge on mock transport - keep fictional mouse art. */
  applyDemoSkin() {
    this._identity = DEMO_IDENTITY
    const prev = this.state
    this.state = {
      ...prev,
      buttons: DEMO_BUTTONS.map((b) => {
        const saved = prev.buttons.find((x) => x.id === b.id)
        return {
          ...b,
          action: saved?.action ?? b.action,
          macroId: saved?.macroId,
        }
      }),
      info: { ...prev.info, driveVersion: '0.1.0-demo' },
    }
  }

  restoreDefaults() {
    const info = this.state.info
    const demo = this._identity.id === DEMO_IDENTITY.id
    this.state = {
      ...createDefaultState(),
      info,
      profileIndex: this.state.profileIndex,
      ...(demo ? { buttons: DEMO_BUTTONS.map((b) => ({ ...b })) } : {}),
    }
  }

  exportProfile(): string {
    return JSON.stringify(
      {
        device: this.identity.id,
        profileIndex: this.state.profileIndex,
        buttons: this.state.buttons,
        sensor: this.state.sensor,
        macros: this.state.macros,
        settings: this.state.settings,
      },
      null,
      2,
    )
  }

  importProfile(json: string) {
    const data = JSON.parse(json) as Partial<DeviceState> & { device?: string }
    const templates =
      this._identity.id === DEMO_IDENTITY.id
        ? DEMO_BUTTONS
        : KING_ULTRA_BUTTONS
    if (
      data.device &&
      data.device !== this.identity.id &&
      data.device !== KING_ULTRA_IDENTITY.id &&
      data.device !== DEMO_IDENTITY.id
    ) {
      throw new Error('Profile does not match this device')
    }
    const sensor = data.sensor
      ? {
          ...this.state.sensor,
          ...data.sensor,
          dpiStageCount:
            data.sensor.dpiStageCount ??
            data.sensor.dpiStages?.filter((s) => s.enabled).length ??
            this.state.sensor.dpiStageCount,
        }
      : this.state.sensor
    const buttons = templates.map((tmpl) => {
      const saved = data.buttons?.find((b) => b.id === tmpl.id)
      return {
        ...tmpl,
        action: saved?.action ?? tmpl.action,
        macroId: saved?.macroId,
      }
    })
    this.state = {
      ...this.state,
      buttons,
      sensor,
      macros: data.macros ?? this.state.macros,
      settings: data.settings ?? this.state.settings,
      profileIndex: data.profileIndex ?? this.state.profileIndex,
    }
  }

  async flushToDevice(): Promise<{ wrote: boolean }> {
    return { wrote: this.lastWriteOk }
  }
}
