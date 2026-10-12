import type { DeviceDriver, DeviceWritePhase } from '../../../DeviceDriver'
import type { Transport } from '../../../../transport/types'
import type {
  ButtonAction,
  DeviceState,
  Macro,
  SensorState,
  SettingsState,
} from '../../../types'
import { umdLog } from '../../../../debug/umdLog'
import { createViperV4ProDefaultState } from './defaults'
import { isViperV4ProDevice, VIPER_V4_PRO_IDENTITY } from './identity'
import {
  buildRazerV4Report,
  decodeBatteryPercent,
  decodeLowPowerPercent,
  decodeRazerV4DpiState,
  decodeRazerV4PollingCode,
  encodeRazerV4DpiWriteArgs,
  encodeRazerV4PollingCode,
  encodeU16BE,
  isValidViperV4Dpi,
  normalizeViperV4Dpi,
  razerV4Crc,
  readU16BE,
  VIPER_V4_CMD,
  VIPER_V4_DPI_MAX,
  VIPER_V4_DPI_MIN,
  VIPER_V4_DPI_STEP,
  VIPER_V4_MAX_DPI_STAGES,
  VIPER_V4_PID_DONGLE,
  VIPER_V4_POLL_RATES_HZ,
  VIPER_V4_REPORT_ID,
  VIPER_V4_REPORT_LENGTH,
  VIPER_V4_SLEEP_SECONDS,
  VIPER_V4_STATUS_BUSY,
  VIPER_V4_STATUS_OK,
  decodeDongleLeds,
  decodeAngleTune,
  dynModeIdToWire,
  dynWireToModeId,
  encodeAngleTune,
  encodeButtonAssignment,
  encodeDongleLeds,
  encodeDynSensMode,
  encodeDynSensState,
  encodeLiftSetting,
  encodeLowPowerPercent,
  encodeProximityConfiguration,
  encodeProximitySensorState,
  VIPER_V4_DPI_FN,
  VIPER_V4_MOUSE_FN,
  type ViperV4ButtonAssignment,
  type ViperV4DongleLeds,
  type ViperV4DpiState,
  type ViperV4DynModeId,
  type ViperV4DynamicSensitivity,
  type ViperV4Rotation,
  type ViperV4SmartTracking,
} from './protocol'

/** Wireless SETs often stay `busy` longer than wired; Synapse polls up to ~20 reads. */
const RESPONSE_ATTEMPTS = 48
const RESPONSE_DELAY_MS = 40
const POST_SEND_DELAY_MS = 25
/** Polling-rate SET reconfigures the radio — following SETs need settle time. */
const POLL_RATE_SETTLE_MS = 450

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

type SensorDirty = {
  polling: boolean
  sleep: boolean
  lowPower: boolean
  dongleLeds: boolean
  smartTracking: boolean
  rotation: boolean
  dynSens: boolean
}

/**
 * Native UMD driver for Viper V4 Pro.
 * Wire format: 90-byte Razer V4 feature reports (see protocol.ts).
 */
export class ViperV4ProDriver implements DeviceDriver {
  readonly identity = VIPER_V4_PRO_IDENTITY
  readonly capabilities: NonNullable<DeviceDriver['capabilities']> = {
    dpi: true,
    dpiWritable: true,
    reportRate: true,
    reportRateWritable: true,
    lod: false,
    lodWritable: false,
    angleSnapping: false,
    rippleControl: false,
    motionSync: false,
    powerModes: false,
    buttons: true,
    deviceSettings: true,
    pollRatesHz: [...VIPER_V4_POLL_RATES_HZ],
    dpiMin: VIPER_V4_DPI_MIN,
    dpiMax: VIPER_V4_DPI_MAX,
    dpiStep: VIPER_V4_DPI_STEP,
    dpiMaxStages: VIPER_V4_MAX_DPI_STAGES,
    dpiCountEditable: true,
    statusNote:
      'DPI / polling / sleep / battery via Razer V4 control channel. Close Synapse if WebHID cannot open the config interface.',
    pollingNote: 'Up to 8 kHz on HyperSpeed; wired tops out at 1 kHz on verified captures.',
  }
  readonly protocolDiagnostics: string[] = []
  lastWriteError: string | null = null
  lastWriteOk = false
  lastVerifyNote: string | null = 'Viper V4 Pro - waiting for WebHID'
  mouseReachable = false
  writePhase: DeviceWritePhase = 'idle'

  private state = createViperV4ProDefaultState()
  private device: HIDDevice | null = null
  private listeners = new Set<(p: DeviceWritePhase) => void>()
  private dpiTimer: ReturnType<typeof setTimeout> | null = null
  private sensorTimer: ReturnType<typeof setTimeout> | null = null
  private mock = false
  private lowBatteryWarning = 15
  /** Matches Synapse: bump tid each SET so a stuck busy reply is not re-read forever. */
  private transactionId = 0x1f
  private sensorDirty: SensorDirty = {
    polling: false,
    sleep: false,
    lowPower: false,
    dongleLeds: false,
    smartTracking: false,
    rotation: false,
    dynSens: false,
  }
  /** Live UI state for Power / Dongle LED / Calibration / Advanced. */
  viperExtras = {
    lowPowerPercent: 5,
    dongleLeds: [2, 1, 3] as ViperV4DongleLeds,
    /** Active Customize layer (Synapse Standard / Hypershift). */
    hypershift: false,
    smartTracking: {
      isAsymmetric: false,
      trackingDistance: 2,
      liftOffDistance: 13,
      landingDistance: 12,
    } as ViperV4SmartTracking,
    rotation: { isEnabled: true, value: 0 } as ViperV4Rotation,
    dynSens: { state: 0, mode: 0 } as ViperV4DynamicSensitivity,
    unsupported: ['Smart Polling Rate Switcher'] as string[],
  }

  private buttonTimer: ReturnType<typeof setTimeout> | null = null
  private pendingButtonIds = new Set<number>()

  getState() {
    return this.state
  }

  onWritePhase(cb: (p: DeviceWritePhase) => void) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private setPhase(phase: DeviceWritePhase) {
    this.writePhase = phase
    for (const cb of this.listeners) cb(phase)
  }

  async attach(transport: Transport) {
    this.mock = transport.kind === 'mock'
    if (this.mock) {
      this.state = {
        ...createViperV4ProDefaultState(),
        info: {
          ...createViperV4ProDefaultState().info,
          connection: 'wireless',
          batteryPercent: 76,
          charging: false,
          mouseFirmware: 'demo',
          receiverFirmware: 'demo',
        },
      }
      this.mouseReachable = true
      this.lastVerifyNote = 'Viper V4 Pro demo (mock)'
      return
    }
    await this.attachNative()
  }

  async attachNative(opts?: { preferPid?: number; device?: HIDDevice }) {
    this.mock = false
    if (!navigator.hid) throw new Error('WebHID is unavailable in this browser')
    const selected =
      opts?.device ??
      (await navigator.hid.getDevices()).find((d) =>
        isViperV4ProDevice(d.vendorId, d.productId),
      )
    if (!selected) throw new Error('Viper V4 Pro not authorized in WebHID')
    if (!isViperV4ProDevice(selected.vendorId, selected.productId)) {
      throw new Error('Selected HID device is not a Viper V4 Pro')
    }
    if (!selected.opened) {
      try {
        await selected.open()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new Error(
          `${msg} Close Razer Synapse / RazerAppEngine if it holds the control interface, then retry.`,
        )
      }
    }
    this.device = selected
    this.mouseReachable = true
    const wireless = selected.productId === VIPER_V4_PID_DONGLE
    this.state = {
      ...this.state,
      info: {
        ...this.state.info,
        connection: wireless ? 'wireless' : 'corded',
      },
      sensor: {
        ...this.state.sensor,
        mode: wireless ? 'lp' : 'corded',
      },
    }
    this.protocolDiagnostics.splice(
      0,
      this.protocolDiagnostics.length,
      `VID:PID 1532:${selected.productId.toString(16).padStart(4, '0').toUpperCase()}`,
      `product ${selected.productName || 'not reported'}`,
      `collections ${selected.collections?.length ?? 0}`,
    )
    this.lastVerifyNote = `Viper V4 Pro attached · ${wireless ? 'HyperSpeed' : 'wired'}`
    umdLog('viper-v4', 'info', 'attached', {
      pid: selected.productId.toString(16),
      productName: selected.productName,
    })
  }

  async detach() {
    if (this.dpiTimer) clearTimeout(this.dpiTimer)
    if (this.sensorTimer) clearTimeout(this.sensorTimer)
    if (this.buttonTimer) clearTimeout(this.buttonTimer)
    this.pendingButtonIds.clear()
    if (this.device?.opened) {
      try {
        await this.device.close()
      } catch {
        /* ignore */
      }
    }
    this.device = null
    this.mouseReachable = false
  }

  async probeFlashAndSync() {
    if (this.mock) {
      this.mouseReachable = true
      return
    }
    if (!this.device) throw new Error('Viper V4 Pro not attached')
    try {
      const dpi = await this.readDpi()
      const pollingArgs = await this.command(
        VIPER_V4_CMD.pollingRead.class,
        VIPER_V4_CMD.pollingRead.id,
        2,
        Uint8Array.of(1),
      )
      const batteryArgs = await this.command(
        VIPER_V4_CMD.batteryRead.class,
        VIPER_V4_CMD.batteryRead.id,
        2,
        Uint8Array.of(0, 0),
      )
      const chargingArgs = await this.command(
        VIPER_V4_CMD.chargingRead.class,
        VIPER_V4_CMD.chargingRead.id,
        2,
        Uint8Array.of(0, 0),
      )
      const sleepArgs = await this.command(
        VIPER_V4_CMD.sleepRead.class,
        VIPER_V4_CMD.sleepRead.id,
        2,
      )
      const lowPowerArgs = await this.command(
        VIPER_V4_CMD.lowPowerRead.class,
        VIPER_V4_CMD.lowPowerRead.id,
        1,
      )
      let dongleLeds: ViperV4DongleLeds = [2, 1, 3]
      try {
        const ledArgs = await this.command(
          VIPER_V4_CMD.dongleLedRead.class,
          VIPER_V4_CMD.dongleLedRead.id,
          3,
        )
        dongleLeds = decodeDongleLeds(ledArgs)
      } catch {
        /* wired mouse has no dongle indicators */
      }

      const rate = decodeRazerV4PollingCode(pollingArgs[1] ?? 0) ?? 1000
      const sleepSec = readU16BE(sleepArgs, 0)
      this.lowBatteryWarning = decodeLowPowerPercent(lowPowerArgs[0] ?? 0)
      this.viperExtras.lowPowerPercent = this.lowBatteryWarning
      this.viperExtras.dongleLeds = dongleLeds
      this.applyDpiState(dpi)
      this.state = {
        ...this.state,
        sensor: {
          ...this.state.sensor,
          reportRate: rate,
          reportRateWireless: rate,
          reportRateWired: Math.min(rate, 1000),
        },
        settings: {
          ...this.state.settings,
          sleepAfterMin: Math.max(1, Math.round(sleepSec / 60)),
        },
        info: {
          ...this.state.info,
          batteryPercent: decodeBatteryPercent(batteryArgs[1] ?? 0),
          charging: (chargingArgs[1] ?? 0) === 1,
        },
      }
      this.mouseReachable = true
      this.lastVerifyNote = `Viper V4 Pro synced · ${rate} Hz · DPI ${dpi.stages[dpi.activeStage]?.x ?? '?'}${
        this.state.info.batteryPercent != null
          ? ` · ${this.state.info.batteryPercent}%`
          : ''
      }`
      umdLog('viper-v4', 'info', 'synced', {
        rate,
        dpi: dpi.stages[dpi.activeStage],
        battery: this.state.info.batteryPercent,
        sleepSec,
        lowBatteryWarning: this.lowBatteryWarning,
      })
    } catch (err) {
      this.mouseReachable = false
      this.lastVerifyNote =
        err instanceof Error ? err.message : 'Viper V4 Pro sync failed'
      umdLog('viper-v4', 'warn', 'probe failed', this.lastVerifyNote)
      throw err
    }
  }

  private applyDpiState(dpi: ViperV4DpiState) {
    const stages = Array.from({ length: VIPER_V4_MAX_DPI_STAGES }, (_, index) => {
      const src = dpi.stages[index]
      const enabled = index < dpi.stages.length && src != null
      const value = enabled ? normalizeViperV4Dpi(src!.x) : 0
      const valueY = enabled ? normalizeViperV4Dpi(src!.y) : 0
      return {
        index,
        value,
        valueY,
        color: '#44d62c',
        enabled,
      }
    })
    this.state = {
      ...this.state,
      sensor: {
        ...this.state.sensor,
        dpiStages: stages,
        dpiStageCount: dpi.stages.length,
        activeDpiIndex: dpi.activeStage,
        defaultDpiIndex: dpi.activeStage,
      },
    }
  }

  private currentDpiState(): ViperV4DpiState {
    const enabled = this.state.sensor.dpiStages.filter((s) => s.enabled && s.value > 0)
    return {
      activeStage: Math.min(
        this.state.sensor.activeDpiIndex,
        Math.max(0, enabled.length - 1),
      ),
      stages: enabled.map((s) => ({
        x: normalizeViperV4Dpi(s.value),
        y: normalizeViperV4Dpi(s.valueY ?? s.value),
      })),
    }
  }

  private async readDpi(): Promise<ViperV4DpiState> {
    const args = await this.command(
      VIPER_V4_CMD.dpiRead.class,
      VIPER_V4_CMD.dpiRead.id,
      80,
    )
    return decodeRazerV4DpiState(args)
  }

  private nextTransactionId(): number {
    this.transactionId = (this.transactionId + 1) & 0xff
    return this.transactionId
  }

  private async command(
    commandClass: number,
    commandId: number,
    dataSize: number,
    args: Uint8Array = new Uint8Array(),
  ): Promise<Uint8Array> {
    if (!this.device) throw new Error('Viper V4 Pro not attached')
    if (!this.device.opened) await this.device.open()
    const tid = this.nextTransactionId()
    const request = buildRazerV4Report(
      commandClass,
      commandId,
      dataSize,
      args,
      tid,
    )
    await this.device.sendFeatureReport(VIPER_V4_REPORT_ID, request as BufferSource)
    await sleep(POST_SEND_DELAY_MS)
    for (let attempt = 0; attempt < RESPONSE_ATTEMPTS; attempt += 1) {
      const view = await this.device.receiveFeatureReport(VIPER_V4_REPORT_ID)
      const response = new Uint8Array(
        view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength),
      )
      if (
        response.byteLength !== VIPER_V4_REPORT_LENGTH ||
        response[88] !== razerV4Crc(response)
      ) {
        throw new Error('Viper V4 Pro returned an invalid Razer control report')
      }
      const status = response[0] ?? 0
      if (status === VIPER_V4_STATUS_OK) {
        if (response[6] !== commandClass || response[7] !== commandId) {
          throw new Error('Viper V4 Pro returned a response for a different command')
        }
        const size = response[5] ?? 0
        return response.slice(8, 8 + size)
      }
      // 0x00 = new/queued echo, 0x01 = busy — both need another poll on wireless.
      if (status === VIPER_V4_STATUS_BUSY || status === 0x00) {
        await sleep(RESPONSE_DELAY_MS)
        continue
      }
      throw new Error(
        `Viper V4 Pro rejected command ${commandClass.toString(16)}/${commandId.toString(16)} (status 0x${status.toString(16)})`,
      )
    }
    throw new Error(
      `Viper V4 Pro remained busy on ${commandClass.toString(16)}/${commandId.toString(16)} — wait for radio settle (drop poll rate if at 4–8 kHz) and retry`,
    )
  }

  private markSensorDirty(patch: Partial<SensorDirty>) {
    Object.assign(this.sensorDirty, patch)
    this.scheduleSensorFlush()
  }

  setProfile(index: number) {
    this.state.profileIndex = index
  }

  setHypershift(on: boolean) {
    this.viperExtras.hypershift = on
  }

  setButtonAction(buttonId: number, action: ButtonAction, macroId?: string) {
    const b = this.state.buttons.find((x) => x.id === buttonId)
    if (!b) return
    b.action = action
    if (macroId != null) b.macroId = macroId
    else delete b.macroId
    this.pendingButtonIds.add(buttonId)
    if (this.buttonTimer) clearTimeout(this.buttonTimer)
    this.buttonTimer = setTimeout(() => {
      this.buttonTimer = null
      void this.flushPendingButtons()
    }, 80)
  }

  private buttonActionToAssignment(
    action: ButtonAction,
  ): ViperV4ButtonAssignment | null {
    switch (action) {
      case 'left':
        return { kind: 'mouse', mouseFn: VIPER_V4_MOUSE_FN.left }
      case 'right':
        return { kind: 'mouse', mouseFn: VIPER_V4_MOUSE_FN.right }
      case 'middle':
        return { kind: 'mouse', mouseFn: VIPER_V4_MOUSE_FN.middle }
      case 'back':
        return { kind: 'mouse', mouseFn: VIPER_V4_MOUSE_FN.back }
      case 'forward':
        return { kind: 'mouse', mouseFn: VIPER_V4_MOUSE_FN.forward }
      case 'scroll_up':
        return { kind: 'mouse', mouseFn: VIPER_V4_MOUSE_FN.scrollUp }
      case 'scroll_down':
        return { kind: 'mouse', mouseFn: VIPER_V4_MOUSE_FN.scrollDown }
      case 'dpi_cycle':
        return { kind: 'dpi', dpiFn: VIPER_V4_DPI_FN.cycleUp }
      case 'dpi_up':
        return { kind: 'dpi', dpiFn: VIPER_V4_DPI_FN.up }
      case 'dpi_down':
        return { kind: 'dpi', dpiFn: VIPER_V4_DPI_FN.down }
      case 'disabled':
        return { kind: 'off' }
      default:
        return null
    }
  }

  private async flushPendingButtons() {
    if (this.mock || !this.device) {
      this.pendingButtonIds.clear()
      return
    }
    const ids = [...this.pendingButtonIds]
    this.pendingButtonIds.clear()
    this.setPhase('writing')
    try {
      for (const id of ids) {
        const btn = this.state.buttons.find((x) => x.id === id)
        if (!btn) continue
        const assignment = this.buttonActionToAssignment(btn.action)
        if (!assignment) {
          this.protocolDiagnostics.push(
            `button ${id}: action ${btn.action} not mapped to Synapse fnId yet`,
          )
          continue
        }
        const args = encodeButtonAssignment(id, assignment, {
          hypershift: this.viperExtras.hypershift,
        })
        await this.command(
          VIPER_V4_CMD.buttonWrite.class,
          VIPER_V4_CMD.buttonWrite.id,
          args.length,
          args,
        )
      }
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = `Buttons flushed (${ids.length}) · ${
        this.viperExtras.hypershift ? 'Hypershift' : 'Standard'
      }`
      this.setPhase('ok')
    } catch (err) {
      this.lastWriteOk = false
      this.lastWriteError = err instanceof Error ? err.message : String(err)
      this.setPhase('error')
    }
  }

  patchSensor(patch: Partial<SensorState>) {
    Object.assign(this.state.sensor, patch)
    if (patch.activeDpiIndex != null) this.scheduleDpiFlush()
    if (patch.reportRate != null) {
      this.state.sensor.reportRateWireless = patch.reportRate
      if (this.state.info.connection === 'corded') {
        this.state.sensor.reportRateWired = patch.reportRate
      }
      this.markSensorDirty({ polling: true })
    }
  }

  setDpiStageCount(count: number) {
    const n = Math.max(1, Math.min(VIPER_V4_MAX_DPI_STAGES, Math.round(count)))
    const presets = [800, 1600, 3200, 6400, 12800]
    this.state.sensor.dpiStages = presets.map((preset, i) => {
      const prev = this.state.sensor.dpiStages[i]
      const enabled = i < n
      const value = enabled
        ? prev && prev.value > 0
          ? prev.value
          : preset
        : 0
      const valueY = enabled
        ? prev && prev.value > 0
          ? (prev.valueY ?? prev.value)
          : value
        : 0
      return { index: i, value, valueY, color: '#44d62c', enabled }
    })
    this.state.sensor.dpiStageCount = n
    if (this.state.sensor.activeDpiIndex >= n) this.state.sensor.activeDpiIndex = 0
    if ((this.state.sensor.defaultDpiIndex ?? 0) >= n) {
      this.state.sensor.defaultDpiIndex = 0
    }
    this.scheduleDpiFlush()
  }

  setDpiStage(index: number, value: number, valueY?: number) {
    const stage = this.state.sensor.dpiStages[index]
    if (!stage || !stage.enabled) return
    const linked = (stage.valueY ?? stage.value) === stage.value
    const x = normalizeViperV4Dpi(value)
    stage.value = x
    stage.valueY =
      valueY != null ? normalizeViperV4Dpi(valueY) : linked ? x : stage.valueY
    this.scheduleDpiFlush()
  }

  setMacros(macros: Macro[]) {
    this.state.macros = macros
  }

  patchSettings(patch: Partial<SettingsState>) {
    Object.assign(this.state.settings, patch)
    if (patch.sleepAfterMin != null) this.markSensorDirty({ sleep: true })
  }

  setLowPowerPercent(percent: number) {
    this.viperExtras.lowPowerPercent = Math.max(5, Math.min(100, Math.round(percent)))
    this.markSensorDirty({ lowPower: true })
  }

  setDongleLed(index: 0 | 1 | 2, mode: ViperV4DongleLeds[number]) {
    const next = [...this.viperExtras.dongleLeds] as ViperV4DongleLeds
    next[index] = mode
    this.viperExtras.dongleLeds = next
    this.markSensorDirty({ dongleLeds: true })
  }

  setSmartTracking(patch: Partial<ViperV4SmartTracking>) {
    this.viperExtras.smartTracking = {
      ...this.viperExtras.smartTracking,
      ...patch,
    }
    this.markSensorDirty({ smartTracking: true })
  }

  setRotation(patch: Partial<ViperV4Rotation>) {
    this.viperExtras.rotation = {
      ...this.viperExtras.rotation,
      ...patch,
    }
    if (this.viperExtras.rotation.value != null) {
      const v = this.viperExtras.rotation.value
      this.viperExtras.rotation.value = Math.max(-44, Math.min(44, Math.round(v)))
    }
    this.markSensorDirty({ rotation: true })
  }

  setDynSensMode(id: ViperV4DynModeId) {
    this.viperExtras.dynSens = dynModeIdToWire(id)
    this.markSensorDirty({ dynSens: true })
  }

  getDynSensModeId(): ViperV4DynModeId {
    return dynWireToModeId(this.viperExtras.dynSens)
  }

  restoreDefaults() {
    this.state = createViperV4ProDefaultState()
  }

  exportProfile() {
    return JSON.stringify({ device: this.identity.id, ...this.state }, null, 2)
  }

  importProfile(json: string) {
    const v = JSON.parse(json) as Partial<DeviceState> & { device?: string }
    if (v.device && v.device !== this.identity.id) {
      throw new Error('Profile is not for Viper V4 Pro')
    }
    this.state = { ...this.state, ...v } as DeviceState
  }

  async refreshFirmwareVersions() {
    /* firmware string not mapped yet */
  }

  async refreshSleepFromDevice() {
    if (this.mock || !this.device) return
    const sleepArgs = await this.command(
      VIPER_V4_CMD.sleepRead.class,
      VIPER_V4_CMD.sleepRead.id,
      2,
    )
    this.state.settings.sleepAfterMin = Math.max(
      1,
      Math.round(readU16BE(sleepArgs, 0) / 60),
    )
  }

  async refreshLiveSensorFromDevice() {
    if (this.mock || !this.device) return false
    try {
      const dpi = await this.readDpi()
      const pollingArgs = await this.command(
        VIPER_V4_CMD.pollingRead.class,
        VIPER_V4_CMD.pollingRead.id,
        2,
        Uint8Array.of(1),
      )
      const rate = decodeRazerV4PollingCode(pollingArgs[1] ?? 0)
      let changed = false
      if (dpi.activeStage !== this.state.sensor.activeDpiIndex) {
        this.state.sensor.activeDpiIndex = dpi.activeStage
        changed = true
      }
      if (rate != null && rate !== this.state.sensor.reportRate) {
        this.state.sensor.reportRate = rate
        changed = true
      }
      return changed
    } catch {
      return false
    }
  }

  private scheduleDpiFlush() {
    if (this.mock) return
    if (this.dpiTimer) clearTimeout(this.dpiTimer)
    this.dpiTimer = setTimeout(() => {
      void this.flushDpi()
    }, 280)
  }

  private scheduleSensorFlush() {
    if (this.mock) return
    if (this.sensorTimer) clearTimeout(this.sensorTimer)
    this.sensorTimer = setTimeout(() => {
      void this.flushSensor()
    }, 280)
  }

  private async flushDpi() {
    if (!this.device) return
    this.setPhase('writing')
    try {
      const state = this.currentDpiState()
      for (const stage of state.stages) {
        if (!isValidViperV4Dpi(stage.x) || !isValidViperV4Dpi(stage.y)) {
          throw new Error('DPI must be 100-50,000 in 50-DPI steps')
        }
      }
      const args = encodeRazerV4DpiWriteArgs(state)
      await this.command(
        VIPER_V4_CMD.dpiWrite.class,
        VIPER_V4_CMD.dpiWrite.id,
        args.length,
        args,
      )
      const confirmed = await this.readDpi()
      this.applyDpiState(confirmed)
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = `DPI written · active ${confirmed.stages[confirmed.activeStage]?.x}`
      this.setPhase('ok')
    } catch (err) {
      this.lastWriteOk = false
      this.lastWriteError = err instanceof Error ? err.message : String(err)
      this.setPhase('error')
    }
  }

  private async flushSensor() {
    if (!this.device) return
    const dirty = { ...this.sensorDirty }
    if (
      !dirty.polling &&
      !dirty.sleep &&
      !dirty.lowPower &&
      !dirty.dongleLeds &&
      !dirty.smartTracking &&
      !dirty.rotation &&
      !dirty.dynSens
    ) {
      return
    }
    // Claim dirty bits now so a concurrent UI edit re-queues after this flush.
    this.sensorDirty = {
      polling: false,
      sleep: false,
      lowPower: false,
      dongleLeds: false,
      smartTracking: false,
      rotation: false,
      dynSens: false,
    }
    this.setPhase('writing')
    const notes: string[] = []
    try {
      if (dirty.polling) {
        const rate = this.state.sensor.reportRate
        const code = encodeRazerV4PollingCode(rate)
        if (code == null) throw new Error(`Unsupported polling rate ${rate} Hz`)
        await this.command(
          VIPER_V4_CMD.pollingWrite.class,
          VIPER_V4_CMD.pollingWrite.id,
          2,
          Uint8Array.of(1, code),
        )
        await sleep(POLL_RATE_SETTLE_MS)
        const confirmedCode = (
          await this.command(
            VIPER_V4_CMD.pollingRead.class,
            VIPER_V4_CMD.pollingRead.id,
            2,
            Uint8Array.of(1),
          )
        )[1]
        const confirmed = decodeRazerV4PollingCode(confirmedCode ?? 0)
        if (confirmed !== rate) {
          throw new Error(
            `Device kept ${confirmed ?? '?'} Hz instead of ${rate} Hz`,
          )
        }
        notes.push(`Polling ${confirmed} Hz`)
      }

      if (dirty.sleep) {
        const sleepSec = Math.max(
          60,
          Math.min(900, Math.round((this.state.settings.sleepAfterMin || 5) * 60)),
        )
        const nearest =
          VIPER_V4_SLEEP_SECONDS.find((s) => s >= sleepSec) ??
          VIPER_V4_SLEEP_SECONDS[VIPER_V4_SLEEP_SECONDS.length - 1]
        await this.command(
          VIPER_V4_CMD.sleepWrite.class,
          VIPER_V4_CMD.sleepWrite.id,
          2,
          encodeU16BE(nearest),
        )
        const sleepBack = readU16BE(
          await this.command(
            VIPER_V4_CMD.sleepRead.class,
            VIPER_V4_CMD.sleepRead.id,
            2,
          ),
          0,
        )
        this.state.settings.sleepAfterMin = Math.max(1, Math.round(sleepBack / 60))
        notes.push(`sleep ${sleepBack}s`)
      }

      if (dirty.lowPower) {
        const lowByte = encodeLowPowerPercent(this.viperExtras.lowPowerPercent)
        await this.command(
          VIPER_V4_CMD.lowPowerWrite.class,
          VIPER_V4_CMD.lowPowerWrite.id,
          1,
          Uint8Array.of(lowByte),
        )
        const lowBack = await this.command(
          VIPER_V4_CMD.lowPowerRead.class,
          VIPER_V4_CMD.lowPowerRead.id,
          1,
        )
        this.viperExtras.lowPowerPercent = decodeLowPowerPercent(lowBack[0] ?? 0)
        notes.push(`LPM ${this.viperExtras.lowPowerPercent}%`)
      }

      if (dirty.dongleLeds && this.state.info.connection === 'wireless') {
        const ledArgs = encodeDongleLeds(this.viperExtras.dongleLeds)
        await this.command(
          VIPER_V4_CMD.dongleLedWrite.class,
          VIPER_V4_CMD.dongleLedWrite.id,
          3,
          ledArgs,
        )
        try {
          const ledBack = await this.command(
            VIPER_V4_CMD.dongleLedRead.class,
            VIPER_V4_CMD.dongleLedRead.id,
            3,
          )
          this.viperExtras.dongleLeds = decodeDongleLeds(ledBack)
        } catch {
          /* some firmware paths echo only via SET */
        }
        notes.push(
          `LED ${this.viperExtras.dongleLeds[0]}/${this.viperExtras.dongleLeds[1]}/${this.viperExtras.dongleLeds[2]}`,
        )
      }

      if (dirty.smartTracking) {
        const tr = this.viperExtras.smartTracking
        await this.command(
          VIPER_V4_CMD.proximityStateWrite.class,
          VIPER_V4_CMD.proximityStateWrite.id,
          3,
          encodeProximitySensorState(true),
        )
        const liftArgs = encodeLiftSetting(tr)
        await this.command(
          VIPER_V4_CMD.liftSettingWrite.class,
          VIPER_V4_CMD.liftSettingWrite.id,
          liftArgs.length,
          liftArgs,
        )
        if (tr.isAsymmetric) {
          const cfg = encodeProximityConfiguration(tr)
          await this.command(
            VIPER_V4_CMD.proximityConfigWrite.class,
            VIPER_V4_CMD.proximityConfigWrite.id,
            cfg.length,
            cfg,
          )
          notes.push(
            `LOD asym lift=${tr.liftOffDistance} land=${tr.landingDistance}`,
          )
        } else {
          notes.push(`LOD distance=${tr.trackingDistance}`)
        }
      }

      if (dirty.rotation) {
        const rot = { ...this.viperExtras.rotation }
        const args = encodeAngleTune(rot)
        await this.command(
          VIPER_V4_CMD.angleTuneWrite.class,
          VIPER_V4_CMD.angleTuneWrite.id,
          args.length,
          args,
        )
        try {
          const back = await this.command(
            VIPER_V4_CMD.angleTuneRead.class,
            VIPER_V4_CMD.angleTuneRead.id,
            3,
            Uint8Array.of(1),
          )
          const decoded = decodeAngleTune(back)
          if (!rot.isEnabled) {
            // Keep slider degrees for re-enable; force off even if GET echoes stale enabled.
            this.viperExtras.rotation = {
              isEnabled: false,
              value: rot.value,
            }
          } else {
            this.viperExtras.rotation = decoded
          }
        } catch {
          /* SET-only firmwares — keep what we wrote */
          this.viperExtras.rotation = rot
        }
        notes.push(
          `Rotation ${this.viperExtras.rotation.isEnabled ? this.viperExtras.rotation.value + '°' : 'off'}`,
        )
      }

      if (dirty.dynSens) {
        const dyn = this.viperExtras.dynSens
        await this.command(
          VIPER_V4_CMD.dynSensStateWrite.class,
          VIPER_V4_CMD.dynSensStateWrite.id,
          2,
          encodeDynSensState(dyn.state),
        )
        if (dyn.state !== 0) {
          await this.command(
            VIPER_V4_CMD.dynSensModeWrite.class,
            VIPER_V4_CMD.dynSensModeWrite.id,
            2,
            encodeDynSensMode(dyn.mode),
          )
        }
        notes.push(`DynSens ${dynWireToModeId(dyn)}`)
      }

      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = notes.join(' · ') || 'Sensor flush ok'
      this.setPhase('ok')
    } catch (err) {
      // Re-queue failed dirty bits so the user can retry without re-editing.
      this.sensorDirty = {
        polling: this.sensorDirty.polling || dirty.polling,
        sleep: this.sensorDirty.sleep || dirty.sleep,
        lowPower: this.sensorDirty.lowPower || dirty.lowPower,
        dongleLeds: this.sensorDirty.dongleLeds || dirty.dongleLeds,
        smartTracking: this.sensorDirty.smartTracking || dirty.smartTracking,
        rotation: this.sensorDirty.rotation || dirty.rotation,
        dynSens: this.sensorDirty.dynSens || dirty.dynSens,
      }
      this.lastWriteOk = false
      this.lastWriteError = err instanceof Error ? err.message : String(err)
      this.setPhase('error')
    }
  }

  async flushToDevice() {
    if (this.mock) return { wrote: false }
    await this.flushDpi()
    this.sensorDirty = {
      polling: true,
      sleep: true,
      lowPower: true,
      dongleLeds: this.state.info.connection === 'wireless',
      smartTracking: true,
      rotation: true,
      dynSens: true,
    }
    await this.flushSensor()
    return { wrote: this.lastWriteOk }
  }
}
