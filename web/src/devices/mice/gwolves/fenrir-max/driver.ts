import { umdLog } from '../../../../debug/umdLog'
import type { Transport } from '../../../../transport/types'
import type { DeviceDriver, DeviceWritePhase } from '../../../DeviceDriver'
import type {
  ButtonAction,
  DeviceState,
  Macro,
  SensorState,
  SettingsState,
} from '../../../types'
import { FENRIR_MAX_BUTTONS } from './buttons'
import {
  fenrirClickLevelIndex,
  fenrirClickQuadFromLevel,
  fenrirWheelLevelIndex,
  FENRIR_CLICK_DEBOUNCE_LEVELS,
} from './debounce'
import { createFenrirDefaultState, FENRIR_DPI_MAX_STAGES } from './defaults'
import { FENRIR_MAX_IDENTITY } from './identity'
import { FENRIR_MAX_PROFILE, pollingRatesForPid } from './profile'
import { clampFenrirSleepSec, FENRIR_SLEEP_DEFAULT_SEC } from './sleep'
import {
  actionToGwSlot,
  defaultGwButtonPayload,
  GW_SLOT_BYTES,
  gwFnToAction,
} from './protocol/gw-buttons'
import { GWolvesDriver } from './protocol/gwolves-driver'
import { fenrirDpiColor } from './theme'

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

function clampLod(mm: number): 0.7 | 1 | 2 {
  if (mm <= 0.85) return 0.7
  if (mm <= 1.5) return 1
  return 2
}

/**
 * UMD adapter over the RE'd GWolvesDriver (FENRIR_MOUSE_DRIVERS).
 * Uses native multi-interface HID (feature-64 + output-8), not King Ultra Transport framing.
 */
export class FenrirMaxDriver implements DeviceDriver {
  readonly identity = FENRIR_MAX_IDENTITY
  private state: DeviceState
  private hid: GWolvesDriver | null = null
  private mock = false
  lastWriteError: string | null = null
  lastWriteOk = false
  lastVerifyNote: string | null = null
  mouseReachable = false
  writePhase: DeviceWritePhase = 'idle'
  private writePhaseListeners = new Set<(p: DeviceWritePhase) => void>()
  private sensorWriteTimer: ReturnType<typeof setTimeout> | null = null
  private pendingSensorPatch: Partial<SensorState> | null = null
  private dpiWriteTimer: ReturnType<typeof setTimeout> | null = null
  private pendingDpi: {
    stageIndex: number
    value: number
    valueY: number
  } | null = null
  private writeChain: Promise<void> = Promise.resolve()
  /** Cached OEM GWOldBtnList (36 bytes). */
  private gwButtonPayload: Uint8Array = defaultGwButtonPayload()

  constructor() {
    this.state = createFenrirDefaultState()
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

  /** Mock / unused for Fenrir WebHID — prefer attachNative. */
  async attach(transport: Transport) {
    this.mock = transport.kind === 'mock'
    if (this.mock) {
      this.state = {
        ...createFenrirDefaultState(),
        info: {
          ...createFenrirDefaultState().info,
          connection: 'wireless',
          charging: false,
          batteryPercent: 88,
          receiverFirmware: 'demo',
          mouseFirmware: 'demo',
        },
      }
      this.mouseReachable = true
      this.lastVerifyNote = 'Fenrir Max demo (mock)'
      return
    }
    await this.attachNative()
  }

  async attachNative(opts?: { preferPid?: number }) {
    this.mock = false
    const hid = new GWolvesDriver(FENRIR_MAX_PROFILE)
    await hid.connect(FENRIR_MAX_PROFILE, {
      // Always allow picker when authorized pool lacks feature-64 vendor iface
      interactive: true,
      preferPid: opts?.preferPid,
    })
    this.hid = hid
    this.state = createFenrirDefaultState()
    const pid = hid.connectedDevice?.productId ?? opts?.preferPid ?? 0
    const wired = pid === FENRIR_MAX_PROFILE.pidWired
    this.state = {
      ...this.state,
      info: {
        ...this.state.info,
        connection: wired ? 'corded' : 'wireless',
      },
      sensor: {
        ...this.state.sensor,
        mode: wired ? 'corded' : 'lp',
        reportRate: wired ? 1000 : 8000,
      },
    }
    umdLog('fenrir', 'info', 'attached', {
      pid: pid.toString(16),
      productName: hid.connectedDevice?.productName,
      iface: hid.getInterfaceDebug(),
    })
  }

  async detach() {
    if (this.sensorWriteTimer) clearTimeout(this.sensorWriteTimer)
    if (this.dpiWriteTimer) clearTimeout(this.dpiWriteTimer)
    try {
      await this.hid?.disconnect()
    } catch {
      /* ignore */
    }
    this.hid = null
    this.mouseReachable = false
  }

  async probeFlashAndSync() {
    if (this.mock || !this.hid) {
      this.mouseReachable = this.mock
      return
    }
    // Read-only — do not drive WriteToast ("Zapisuję…"). Session shows SyncSpinner.
    try {
      const full = await this.hid.getFullState()
      this.applyFullState(full)

      // Buttons + competitive from dedicated OEM paths
      try {
        const gw = await this.hid.getGwButtons()
        this.gwButtonPayload = gw
        this.applyGwButtons(gw)
      } catch (err) {
        umdLog(
          'fenrir',
          'warn',
          'getGWButton failed',
          err instanceof Error ? err.message : err,
        )
      }
      try {
        const comp = await this.hid.getCompetitiveMode()
        this.state = {
          ...this.state,
          sensor: { ...this.state.sensor, peakPerformance: comp },
        }
      } catch {
        /* optional */
      }

      const gotBattery = full.battery?.percent != null
      const gotPoll = full.pollingHz > 0
      this.mouseReachable = gotBattery || gotPoll || Boolean(full.firmware && full.firmware !== '-')
      this.lastVerifyNote = this.mouseReachable
        ? `Fenrir synced · ${full.pollingHz || '?'}Hz · DPI ${full.activeDpiStage}${
            gotBattery ? ` · ${full.battery!.percent}%` : ''
          }`
        : 'Fenrir: brak odpowiedzi feature-64 — wybierz interfejs vendor/dongle w oknie HID'
      umdLog('fenrir', 'info', 'full state', {
        battery: full.battery?.percent,
        pollingHz: full.pollingHz,
        activeDpiStage: full.activeDpiStage,
        dpiStages: full.dpiStages?.stageCount,
        dpiX: full.dpiStages?.x,
        lod: full.lod,
        sleepSeconds: full.sleepSeconds,
        motionSync: full.motionSync,
        angleSnap: full.angleSnap,
        firmware: full.firmware,
        iface: this.hid.getInterfaceDebug(),
        mouseReachable: this.mouseReachable,
      })
    } catch (err) {
      this.mouseReachable = false
      this.lastVerifyNote =
        err instanceof Error ? err.message : 'Fenrir sync failed'
      umdLog('fenrir', 'warn', 'probe failed', this.lastVerifyNote)
      throw err
    }
  }

  private applyGwButtons(payload: Uint8Array) {
    const buttons = this.state.buttons.map((b, i) => {
      const fn = payload[i * GW_SLOT_BYTES] ?? 0
      const action = gwFnToAction(fn)
      const macroId =
        action === 'macro'
          ? String(
              ((payload[i * GW_SLOT_BYTES + 2] ?? 0) << 8) |
                (payload[i * GW_SLOT_BYTES + 3] ?? 0),
            )
          : undefined
      return { ...b, action, macroId }
    })
    this.state = { ...this.state, buttons }
  }

  private applyFullState(
    full: Awaited<ReturnType<GWolvesDriver['getFullState']>>,
  ) {
    const stages = full.dpiStages
    let dpiStages = this.state.sensor.dpiStages
    let dpiStageCount = this.state.sensor.dpiStageCount
    if (stages && stages.x.length > 0) {
      dpiStageCount = Math.min(
        FENRIR_DPI_MAX_STAGES,
        Math.max(1, stages.stageCount || stages.x.length),
      )
      dpiStages = this.state.sensor.dpiStages.map((s, i) => {
        const value = stages.x[i] ?? s.value
        const valueY = stages.y[i] ?? stages.x[i] ?? s.valueY ?? value
        const color = full.dpiColors[i] || s.color || fenrirDpiColor(i)
        return {
          ...s,
          value,
          valueY,
          color,
          enabled: i < dpiStageCount,
        }
      })
    } else if (full.dpiColors.length > 0) {
      dpiStages = this.state.sensor.dpiStages.map((s, i) => ({
        ...s,
        color: full.dpiColors[i] || s.color,
      }))
    }

    // OEM active DPI is 1-based (Level 1 → index 0)
    const activeDpiIndex = Math.min(
      dpiStageCount - 1,
      Math.max(0, (full.activeDpiStage || 1) - 1),
    )

    const lodMm =
      full.lod > 0 ? clampLod(full.lod) : this.state.sensor.lodMm
    const sleepSec = clampFenrirSleepSec(
      full.sleepSeconds || FENRIR_SLEEP_DEFAULT_SEC,
    )
    const sleepMin = Math.max(1, Math.round(sleepSec / 60))
    const rates = pollingRatesForPid(
      FENRIR_MAX_PROFILE,
      full.pid || FENRIR_MAX_PROFILE.pidWireless4k8k,
    )
    const reportRate = rates.includes(full.pollingHz)
      ? full.pollingHz
      : this.state.sensor.reportRate

    this.state = {
      ...this.state,
      profileIndex: full.profileId || 0,
      sensor: {
        ...this.state.sensor,
        dpiStages,
        dpiStageCount,
        activeDpiIndex,
        reportRate,
        lodMm,
        mode: full.isWired ? 'corded' : 'lp',
        motionSync: full.motionSync,
        rippleControl: full.rippleControl,
        angleSnapping: full.angleSnap,
        debounceMs: full.debounce?.beforePressMs ?? this.state.sensor.debounceMs,
        debounceBeforePress:
          full.debounce?.beforePressMs ??
          this.state.sensor.debounceBeforePress ??
          this.state.sensor.debounceMs,
        debounceBeforeRelease:
          full.debounce?.beforeReleaseMs ??
          this.state.sensor.debounceBeforeRelease ??
          5,
        debounceAfterPress:
          full.debounce?.afterPressMs ?? this.state.sensor.debounceAfterPress ?? 35,
        debounceAfterRelease:
          full.debounce?.afterReleaseMs ??
          this.state.sensor.debounceAfterRelease ??
          10,
        debounceEnabled:
          full.debounce != null
            ? fenrirClickLevelIndex(
                full.debounce.beforePressMs,
                full.debounce.beforeReleaseMs,
                full.debounce.afterPressMs,
                full.debounce.afterReleaseMs,
              ) < 0
            : this.state.sensor.debounceEnabled,
        debounceLevel: (() => {
          if (!full.debounce) return this.state.sensor.debounceLevel ?? 0
          const idx = fenrirClickLevelIndex(
            full.debounce.beforePressMs,
            full.debounce.beforeReleaseMs,
            full.debounce.afterPressMs,
            full.debounce.afterReleaseMs,
          )
          return idx >= 0 ? idx : this.state.sensor.debounceLevel ?? 0
        })(),
        wheelDebounceMs:
          full.wheelDebounce?.ms ?? this.state.sensor.wheelDebounceMs ?? 8,
        wheelDebounceDiy:
          full.wheelDebounce != null
            ? fenrirWheelLevelIndex(full.wheelDebounce.ms) < 0
            : this.state.sensor.wheelDebounceDiy,
        wheelDebounceRate:
          full.wheelDebounce?.rate ?? this.state.sensor.wheelDebounceRate ?? 0,
        wheelDebounceLevel: (() => {
          if (!full.wheelDebounce) return this.state.sensor.wheelDebounceLevel ?? 0
          const idx = fenrirWheelLevelIndex(full.wheelDebounce.ms)
          return idx >= 0 ? idx : this.state.sensor.wheelDebounceLevel ?? 0
        })(),
        dpiAxisSync: full.dpiAxisSync,
        ledEnabled: full.ledEnabled,
        ledEffect: full.ledEffect || 1,
        sensorAngle: full.sensorAngle,
      },
      settings: {
        ...this.state.settings,
        sleepAfterMin: sleepMin,
        sleepAfterSec: sleepSec,
      },
      info: {
        ...this.state.info,
        batteryPercent: full.battery?.percent ?? null,
        charging: full.battery?.charging ?? false,
        connection: full.isWired ? 'corded' : 'wireless',
        mouseFirmware: full.firmware || '-',
        receiverFirmware: full.isWired ? '-' : full.firmware || '-',
      },
    }
  }

  async refreshFirmwareVersions() {
    if (this.mock || !this.hid) return
    try {
      const fw = await this.hid.getFirmwareVersion()
      const bat = await this.hid.getBatteryLevel()
      this.state = {
        ...this.state,
        info: {
          ...this.state.info,
          mouseFirmware: fw || this.state.info.mouseFirmware,
          receiverFirmware:
            this.state.info.connection === 'corded'
              ? '-'
              : fw || this.state.info.receiverFirmware,
          batteryPercent: bat?.percent ?? this.state.info.batteryPercent,
          charging: bat?.charging ?? this.state.info.charging,
        },
      }
    } catch {
      /* ignore */
    }
  }

  async flushToDevice() {
    return { wrote: false }
  }

  setProfile(index: number) {
    this.state = { ...this.state, profileIndex: index }
  }

  setButtonAction(buttonId: number, action: ButtonAction) {
    this.state = {
      ...this.state,
      buttons: this.state.buttons.map((b) =>
        b.id === buttonId ? { ...b, action } : b,
      ),
    }
    const slotIndex = buttonId - 1
    if (slotIndex < 0 || slotIndex >= 5) return

    const macroNum = Number(this.state.buttons.find((b) => b.id === buttonId)?.macroId) || 1
    const slot = actionToGwSlot(action, macroNum, 1)
    const next = new Uint8Array(this.gwButtonPayload)
    next.set(slot, slotIndex * GW_SLOT_BYTES)
    this.gwButtonPayload = next

    this.queueWrite(async () => {
      const hid = this.hid
      if (!hid || this.mock) return
      await hid.setGwButtons(next)
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = `Key ${buttonId} → ${action}`
      umdLog('fenrir', 'info', 'setGWButton', { buttonId, action, slot })
    })
  }

  setMacros(macros: Macro[]) {
    this.state = { ...this.state, macros }
  }

  restoreDefaults() {
    const lang = this.state.settings.language
    this.state = createFenrirDefaultState()
    this.state = {
      ...this.state,
      settings: { ...this.state.settings, language: lang },
      buttons: FENRIR_MAX_BUTTONS.map((b) => ({ ...b })),
    }
    this.gwButtonPayload = defaultGwButtonPayload()
    this.queueWrite(async () => {
      const hid = this.hid
      if (!hid || this.mock) return
      await hid.resetDevice()
      await sleep(400)
      await this.probeFlashAndSync()
      this.lastWriteOk = true
      this.lastVerifyNote = 'Device reset (OEM resetDevice)'
    })
  }

  exportProfile(): string {
    return JSON.stringify({
      device: FENRIR_MAX_IDENTITY.id,
      profileIndex: this.state.profileIndex,
      buttons: this.state.buttons,
      sensor: this.state.sensor,
      macros: this.state.macros,
      settings: this.state.settings,
    })
  }

  importProfile(json: string) {
    const data = JSON.parse(json) as Partial<DeviceState> & { device?: string }
    this.state = {
      ...this.state,
      profileIndex: data.profileIndex ?? this.state.profileIndex,
      buttons: data.buttons ?? this.state.buttons,
      sensor: data.sensor
        ? { ...this.state.sensor, ...data.sensor }
        : this.state.sensor,
      macros: data.macros ?? this.state.macros,
      settings: data.settings
        ? { ...this.state.settings, ...data.settings }
        : this.state.settings,
    }
  }

  patchSettings(patch: Partial<SettingsState>) {
    const next = { ...this.state.settings, ...patch }
    if (patch.sleepAfterSec != null) {
      const sec = clampFenrirSleepSec(patch.sleepAfterSec)
      next.sleepAfterSec = sec
      next.sleepAfterMin = Math.max(1, Math.round(sec / 60))
    } else if (patch.sleepAfterMin != null) {
      const sec = clampFenrirSleepSec(patch.sleepAfterMin * 60)
      next.sleepAfterSec = sec
      next.sleepAfterMin = Math.max(1, Math.round(sec / 60))
    }
    this.state = {
      ...this.state,
      settings: next,
    }
    if (patch.sleepAfterSec != null || patch.sleepAfterMin != null) {
      const sec = next.sleepAfterSec ?? FENRIR_SLEEP_DEFAULT_SEC
      this.queueWrite(async () => {
        if (!this.hid || this.mock) return
        await this.hid.setSleepTime(sec)
        this.lastWriteOk = true
      })
    }
  }

  setDpiStageCount(count: number) {
    const n = Math.max(1, Math.min(FENRIR_DPI_MAX_STAGES, count))
    this.state = {
      ...this.state,
      sensor: {
        ...this.state.sensor,
        dpiStageCount: n,
        dpiStages: this.state.sensor.dpiStages.map((s, i) => ({
          ...s,
          enabled: i < n,
        })),
        activeDpiIndex: Math.min(this.state.sensor.activeDpiIndex, n - 1),
      },
    }
    this.queueWrite(async () => {
      const hid = this.hid
      if (!hid || this.mock) return
      const profileSlot = 1
      const pairs = this.state.sensor.dpiStages.slice(0, n).map((s) => ({
        x: s.value,
        y: s.valueY ?? s.value,
      }))
      await hid.setDpiStageInfo(profileSlot, n, pairs)
      const active1 = this.state.sensor.activeDpiIndex + 1
      await hid.setActiveDpiStage(active1, profileSlot)
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = `DPI stages → ${n}`
      umdLog('fenrir', 'info', 'setDpiStageCount', { n, active1 })
    })
  }

  setDpiStage(index: number, value: number, valueY?: number) {
    const sync = this.state.sensor.dpiAxisSync !== false
    const y = sync ? value : (valueY ?? value)
    this.state = {
      ...this.state,
      sensor: {
        ...this.state.sensor,
        dpiStages: this.state.sensor.dpiStages.map((s) =>
          s.index === index ? { ...s, value, valueY: y } : s,
        ),
      },
    }
    this.pendingDpi = { stageIndex: index, value, valueY: y }
    if (this.dpiWriteTimer) clearTimeout(this.dpiWriteTimer)
    this.dpiWriteTimer = setTimeout(() => {
      void this.flushDpi()
    }, 220)
  }

  patchSensor(patch: Partial<SensorState>): void | Promise<void> {
    let sensor = { ...this.state.sensor, ...patch }
    if (patch.dpiAxisSync === true) {
      sensor = {
        ...sensor,
        dpiStages: sensor.dpiStages.map((s) => ({
          ...s,
          valueY: s.value,
        })),
      }
    }
    if (patch.dpiAxisSync === false) {
      // Materialize Y on every stage so both axes are concrete before HID write.
      sensor = {
        ...sensor,
        dpiStages: sensor.dpiStages.map((s) => ({
          ...s,
          valueY: s.valueY ?? s.value,
        })),
      }
    }
    // OEM tt(): enabling DIY seeds debounce1–4 from the current preset level.
    if (patch.debounceEnabled === true && this.state.sensor.debounceEnabled !== true) {
      const quad = fenrirClickQuadFromLevel(sensor.debounceLevel ?? 0)
      sensor = {
        ...sensor,
        debounceBeforePress: patch.debounceBeforePress ?? quad.beforePress,
        debounceBeforeRelease: patch.debounceBeforeRelease ?? quad.beforeRelease,
        debounceAfterPress: patch.debounceAfterPress ?? quad.afterPress,
        debounceAfterRelease: patch.debounceAfterRelease ?? quad.afterRelease,
        debounceMs: patch.debounceBeforePress ?? quad.beforePress,
      }
    }
    if (patch.debounceEnabled === false && patch.debounceLevel != null) {
      const quad = fenrirClickQuadFromLevel(patch.debounceLevel)
      sensor = {
        ...sensor,
        debounceBeforePress: quad.beforePress,
        debounceBeforeRelease: quad.beforeRelease,
        debounceAfterPress: quad.afterPress,
        debounceAfterRelease: quad.afterRelease,
        debounceMs: quad.beforePress,
      }
    }
    if (patch.debounceBeforePress != null) {
      sensor = { ...sensor, debounceMs: patch.debounceBeforePress }
    }
    if (patch.ledEnabled === true && !(sensor.ledEffect && sensor.ledEffect > 0)) {
      sensor = { ...sensor, ledEffect: 1 }
    }
    this.state = {
      ...this.state,
      sensor,
    }
    this.pendingSensorPatch = { ...this.pendingSensorPatch, ...patch }

    // Axis Sync: OEM fires setDPIStageInfo immediately on toggle — don't debounce.
    if (patch.dpiAxisSync != null) {
      if (this.sensorWriteTimer) {
        clearTimeout(this.sensorWriteTimer)
        this.sensorWriteTimer = null
      }
      return this.flushSensor()
    }

    if (this.sensorWriteTimer) clearTimeout(this.sensorWriteTimer)
    this.sensorWriteTimer = setTimeout(() => {
      void this.flushSensor()
    }, 220)
  }

  /** OEM zr — change active DPI stage LED color via SetDPIStageColors. */
  setActiveDpiColor(color: string) {
    const idx = this.state.sensor.activeDpiIndex
    const dpiStages = this.state.sensor.dpiStages.map((s) =>
      s.index === idx ? { ...s, color } : s,
    )
    this.state = {
      ...this.state,
      sensor: { ...this.state.sensor, dpiStages },
    }
    this.queueWrite(async () => {
      const hid = this.hid
      if (!hid || this.mock) return
      const colors = this.state.sensor.dpiStages.map((s) => s.color || fenrirDpiColor(s.index))
      await hid.setDpiStageColors(1, colors)
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = `DPI color L${idx + 1} → ${color}`
      umdLog('fenrir', 'info', 'setDpiStageColors', { idx, color })
    })
  }

  private async flushDpi() {
    const pending = this.pendingDpi
    this.pendingDpi = null
    if (!pending || this.mock || !this.hid) return
    this.queueWrite(async () => {
      const hid = this.hid
      if (!hid) return
      const profileSlot = 1
      const stage1 = pending.stageIndex + 1
      await hid.setDpiStageValue(
        profileSlot,
        stage1,
        pending.value,
        pending.valueY,
      )
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote =
        pending.value === pending.valueY
          ? `DPI L${stage1} → ${pending.value}`
          : `DPI L${stage1} → X${pending.value}/Y${pending.valueY}`
      umdLog('fenrir', 'info', 'setDpiStageValue', {
        stage1,
        x: pending.value,
        y: pending.valueY,
      })
    })
  }

  private async flushSensor(): Promise<void> {
    const patch = this.pendingSensorPatch
    this.pendingSensorPatch = null
    if (!patch || this.mock || !this.hid) return
    await this.queueWrite(async () => {
      const hid = this.hid
      if (!hid) return
      const profileSlot = 1
      const notes: string[] = []

      if (patch.reportRate != null) {
        await hid.setPollingRateHz(patch.reportRate)
        notes.push(`${patch.reportRate}Hz`)
      }
      if (patch.activeDpiIndex != null) {
        // OEM setActiveDPI is 1-based
        await hid.setActiveDpiStage(patch.activeDpiIndex + 1, profileSlot)
        notes.push(`DPI L${patch.activeDpiIndex + 1}`)
      }
      if (patch.lodMm != null) {
        await hid.setLod(patch.lodMm, profileSlot)
        notes.push(`LOD ${patch.lodMm}mm`)
      }
      if (patch.motionSync != null) {
        await hid.setMotionSync(patch.motionSync, profileSlot)
        notes.push(`MS ${patch.motionSync ? 'on' : 'off'}`)
      }
      if (patch.angleSnapping != null) {
        await hid.setAngleSnap(patch.angleSnapping, profileSlot)
        notes.push(`AS ${patch.angleSnapping ? 'on' : 'off'}`)
      }
      if (patch.rippleControl != null) {
        await hid.setRippleControl(patch.rippleControl, profileSlot)
        notes.push(`RC ${patch.rippleControl ? 'on' : 'off'}`)
      }
      if (patch.peakPerformance != null) {
        await hid.setCompetitiveMode(patch.peakPerformance)
        notes.push(`Competitive ${patch.peakPerformance ? 'on' : 'off'}`)
      }
      if (
        patch.debounceMs != null ||
        patch.debounceEnabled != null ||
        patch.debounceLevel != null ||
        patch.debounceBeforePress != null ||
        patch.debounceBeforeRelease != null ||
        patch.debounceAfterPress != null ||
        patch.debounceAfterRelease != null
      ) {
        const diy =
          patch.debounceEnabled ?? this.state.sensor.debounceEnabled
        if (diy) {
          // OEM He(): setDebounce(debounce1, [debounce2, debounce3, debounce4])
          const beforePress =
            patch.debounceBeforePress ??
            this.state.sensor.debounceBeforePress ??
            patch.debounceMs ??
            this.state.sensor.debounceMs
          const beforeRelease =
            patch.debounceBeforeRelease ??
            this.state.sensor.debounceBeforeRelease ??
            5
          const afterPress =
            patch.debounceAfterPress ??
            this.state.sensor.debounceAfterPress ??
            35
          const afterRelease =
            patch.debounceAfterRelease ??
            this.state.sensor.debounceAfterRelease ??
            10
          await hid.setDebounceInfo({
            beforePressMs: beforePress,
            beforeReleaseMs: beforeRelease,
            afterPressMs: afterPress,
            afterReleaseMs: afterRelease,
            diyEnabled: true,
          })
          this.state = {
            ...this.state,
            sensor: {
              ...this.state.sensor,
              debounceMs: beforePress,
              debounceBeforePress: beforePress,
              debounceBeforeRelease: beforeRelease,
              debounceAfterPress: afterPress,
              debounceAfterRelease: afterRelease,
            },
          }
          notes.push(
            `Debounce DIY ${beforePress}/${beforeRelease}/${afterPress}/${afterRelease}ms`,
          )
        } else {
          const idx = Math.max(
            0,
            Math.min(
              FENRIR_CLICK_DEBOUNCE_LEVELS.length - 1,
              patch.debounceLevel ?? this.state.sensor.debounceLevel ?? 0,
            ),
          )
          const quad = fenrirClickQuadFromLevel(idx)
          await hid.setDebounceInfo({
            beforePressMs: quad.beforePress,
            beforeReleaseMs: quad.beforeRelease,
            afterPressMs: quad.afterPress,
            afterReleaseMs: quad.afterRelease,
            diyEnabled: false,
          })
          this.state = {
            ...this.state,
            sensor: {
              ...this.state.sensor,
              debounceLevel: idx,
              debounceMs: quad.beforePress,
              debounceBeforePress: quad.beforePress,
              debounceBeforeRelease: quad.beforeRelease,
              debounceAfterPress: quad.afterPress,
              debounceAfterRelease: quad.afterRelease,
            },
          }
          notes.push(`Debounce L${idx + 1}`)
        }
      }
      if (
        patch.wheelDebounceMs != null ||
        patch.wheelDebounceDiy != null ||
        patch.wheelDebounceRate != null ||
        patch.wheelDebounceLevel != null
      ) {
        const ms =
          patch.wheelDebounceMs ?? this.state.sensor.wheelDebounceMs ?? 8
        const rate =
          patch.wheelDebounceRate ?? this.state.sensor.wheelDebounceRate ?? 0
        await hid.setWheelDebounce(rate, ms)
        notes.push(`WheelDebounce ${ms}ms`)
      }
      if (patch.dpiAxisSync != null) {
        const count = Math.max(
          1,
          this.state.sensor.dpiStageCount || this.state.sensor.dpiStages.length,
        )
        const pairs = this.state.sensor.dpiStages.slice(0, count).map((s) => {
          const x = s.value
          // Always send an explicit Y — never leave firmware guessing.
          const y = patch.dpiAxisSync ? x : (s.valueY ?? x)
          return { x, y }
        })
        const activeIdx = Math.min(
          count - 1,
          Math.max(0, this.state.sensor.activeDpiIndex),
        )
        const active = pairs[activeIdx]!

        if (patch.dpiAxisSync) {
          // ON: write Y=X into table first, then arm HID XY link.
          await hid.setDpiStageInfo(profileSlot, count, pairs)
          await hid.setDpiStageValue(
            profileSlot,
            activeIdx + 1,
            active.x,
            active.y,
          )
          await hid.setDpiAxisSync(true, profileSlot)
        } else {
          // OFF: unlock XY first, then push both axes to mouse immediately.
          await hid.setDpiAxisSync(false, profileSlot)
          await hid.setDpiStageInfo(profileSlot, count, pairs)
          await hid.setDpiStageValue(
            profileSlot,
            activeIdx + 1,
            active.x,
            active.y,
          )
        }

        this.state = {
          ...this.state,
          sensor: {
            ...this.state.sensor,
            dpiAxisSync: patch.dpiAxisSync,
            dpiStages: this.state.sensor.dpiStages.map((s, i) => {
              const p = pairs[i]
              if (!p || i >= count) return s
              return { ...s, value: p.x, valueY: p.y }
            }),
          },
        }
        umdLog('fenrir', 'info', 'AxisSync write', {
          enabled: patch.dpiAxisSync,
          activeIdx,
          x: active.x,
          y: active.y,
          pairs,
        })
        notes.push(
          patch.dpiAxisSync
            ? `AxisSync on · DPI X/Y ${active.x}`
            : `AxisSync off · DPI X${active.x}/Y${active.y}`,
        )
      }
      if (patch.ledEnabled != null || patch.ledEffect != null) {
        const enabled = patch.ledEnabled ?? this.state.sensor.ledEnabled !== false
        let effect = patch.ledEffect ?? this.state.sensor.ledEffect ?? 1
        if (enabled && (!effect || effect === 0)) effect = 1
        await hid.setLedState(enabled, effect)
        notes.push(
          enabled
            ? `LED on · effect ${effect === 2 ? 'Breathing' : 'Static'}`
            : 'LED off',
        )
      }
      if (patch.sensorAngle != null) {
        await hid.setSensorAngle(patch.sensorAngle)
        notes.push(`Angle ${patch.sensorAngle}°`)
      }

      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = notes.length
        ? `Wrote · ${notes.join(' · ')}`
        : 'Sensor write (no HID fields)'
      umdLog('fenrir', 'info', 'flushSensor', { patch, notes })
    })
  }

  private queueWrite(fn: () => Promise<void>): Promise<void> {
    this.setWritePhase('queued')
    const run = this.writeChain.then(async () => {
      this.setWritePhase('writing')
      try {
        await fn()
        this.setWritePhase('ok')
        await sleep(80)
        this.setWritePhase('idle')
      } catch (err) {
        this.lastWriteOk = false
        this.lastWriteError =
          err instanceof Error ? err.message : String(err)
        this.lastVerifyNote = this.lastWriteError
        umdLog('fenrir', 'warn', 'write failed', this.lastWriteError)
        this.setWritePhase('error')
        await sleep(200)
        this.setWritePhase('idle')
      }
    })
    this.writeChain = run.catch(() => undefined)
    return run
  }
}
