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
import {
  decodeOnboardButtonMacro,
  encodeOnboardButtonMacro,
  SUPERLIGHT_BUTTONS,
  SUPERLIGHT_LOCKED_BUTTON_IDS,
} from './buttons'
import {
  createSuperlightDefaultState,
  SUPERLIGHT_DPI_MAX,
  SUPERLIGHT_DPI_MAX_STAGES,
  SUPERLIGHT_DPI_MIN,
  SUPERLIGHT_DPI_STEP,
  superlightDpiColor,
} from './defaults'
import { getSuperlightFactorySector } from './factoryProfiles'
import { SUPERLIGHT_IDENTITY } from './identity'
import { HidppClient } from './protocol/hidpp'

/**
 * UMD driver for PRO X SUPERLIGHT gen1 (HID++ 2.0 over C547 Col02).
 * RE: OMM 2.6.1749 + live FeatureSet - onboard 8100/8110 still WIP.
 */
export class SuperlightDriver implements DeviceDriver {
  readonly identity = SUPERLIGHT_IDENTITY
  private state: DeviceState
  private hid: HidppClient | null = null
  private mock = false
  lastWriteError: string | null = null
  lastWriteOk = false
  lastVerifyNote: string | null = null
  mouseReachable = false
  writePhase: DeviceWritePhase = 'idle'
  private writePhaseListeners = new Set<(p: DeviceWritePhase) => void>()
  private onboardDpiTimer: ReturnType<typeof setTimeout> | null = null
  private rateTimer: ReturnType<typeof setTimeout> | null = null
  private pendingRate: number | null = null
  /** Last synced onboard resolutions (for OMM-style per-slot Reset). */
  private savedResolutions: number[] = [800, 0, 0, 0, 0]
  private writeChain: Promise<void> = Promise.resolve()
  private supportedRates: number[] = [125, 250, 500, 1000]
  /** Bumped on profile switch - drops stale DPI/rate writes still on the queue. */
  private profileEpoch = 0
  /** Onboard profile slots (1..N) from 8100 info. */
  profileCount = 5
  /** Live 2201 list - updated on sync (fallback = OMM Superlight constants). */
  private dpiMin = SUPERLIGHT_DPI_MIN
  private dpiMax = SUPERLIGHT_DPI_MAX
  private dpiStep = SUPERLIGHT_DPI_STEP

  constructor() {
    this.state = createSuperlightDefaultState()
  }

  private clampDpi(v: number): number {
    const step = this.dpiStep > 0 ? this.dpiStep : SUPERLIGHT_DPI_STEP
    const stepped = Math.round(v / step) * step
    return Math.min(this.dpiMax, Math.max(this.dpiMin, stepped))
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

  private enqueue(job: () => Promise<void>): Promise<void> {
    this.writeChain = this.writeChain.then(job, job)
    return this.writeChain
  }

  async attach(transport: Transport) {
    this.mock = transport.kind === 'mock'
    if (this.mock) {
      this.state = {
        ...createSuperlightDefaultState(),
        info: {
          ...createSuperlightDefaultState().info,
          batteryPercent: 72,
          charging: false,
          mouseFirmware: 'demo',
          receiverFirmware: 'C547',
        },
      }
      this.mouseReachable = true
      this.lastVerifyNote = 'SUPERLIGHT demo (mock)'
      return
    }
    await this.attachNative()
  }

  async attachNative(opts?: { preferPid?: number }) {
    this.mock = false
    const hid = new HidppClient()
    await hid.connect({ interactive: true, preferPid: opts?.preferPid })
    this.hid = hid
    this.state = createSuperlightDefaultState()
    this.state = {
      ...this.state,
      info: {
        ...this.state.info,
        connection: 'wireless',
      },
    }
    umdLog('superlight', 'info', 'attached', {
      pid: hid.connectedDevice?.productId?.toString(16),
      name: hid.connectedDevice?.productName,
    })
  }

  async detach() {
    if (this.rateTimer) clearTimeout(this.rateTimer)
    if (this.onboardDpiTimer) clearTimeout(this.onboardDpiTimer)
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
    try {
      const name = await this.hid.getDeviceName().catch(() => '')
      const fw = await this.hid.getFwTag().catch(() => '-')
      const batt = await this.hid.getBattery()
      const dpi = await this.hid.getDpi(0)
      const rate = await this.hid.getReportRateHz()
      this.supportedRates = rate.supportedHz
      this.dpiMin = dpi.listMin
      this.dpiMax = dpi.listMax
      this.dpiStep = dpi.listStep > 0 ? dpi.listStep : SUPERLIGHT_DPI_STEP

      const profiles = await this.hid.getOnboardProfilesInfo().catch(() => null)
      if (profiles) {
        this.profileCount = profiles.profileCount
        this.state = {
          ...this.state,
          profileIndex: Math.max(0, profiles.activeSector - 1),
        }
      }

      const onboard = await this.hid.getOnboardDpiTable().catch(() => null)
      const liveDpiIdx = await this.hid.getActiveDpiIndex().catch(() => null)
      const fillDefaults = [800, 1600, 3200, 6400, 12800]
      let stages = this.state.sensor.dpiStages
      let dpiStageCount = this.state.sensor.dpiStageCount
      let activeDpiIndex = this.state.sensor.activeDpiIndex
      let defaultDpiIndex = this.state.sensor.defaultDpiIndex ?? 0
      let dpiShiftIndex = this.state.sensor.dpiShiftIndex ?? 0
      let reportRate = rate.hz
      let buttons = this.state.buttons

      if (onboard) {
        dpiStageCount = onboard.enabledCount
        defaultDpiIndex = Math.min(
          onboard.defaultIndex,
          Math.max(0, dpiStageCount - 1),
        )
        dpiShiftIndex = Math.min(
          onboard.shiftIndex,
          Math.max(0, dpiStageCount - 1),
        )
        activeDpiIndex = Math.min(
          liveDpiIdx ?? onboard.defaultIndex,
          Math.max(0, dpiStageCount - 1),
        )
        if (onboard.reportRateMs > 0) {
          reportRate = Math.round(1000 / onboard.reportRateMs)
        }
        this.savedResolutions = onboard.resolutions.slice(0, 5)
        stages = Array.from({ length: SUPERLIGHT_DPI_MAX_STAGES }, (_, i) => {
          const raw = onboard.resolutions[i] ?? 0
          const enabled = i < dpiStageCount
          const value =
            raw > 0
              ? raw
              : enabled
                ? (fillDefaults[i] ?? 800)
                : (fillDefaults[i] ?? 800)
          return {
            index: i,
            value,
            color: superlightDpiColor(i),
            enabled,
          }
        })
        // Prefer live 2201 DPI for the active slot when it matches a stage
        const liveMatch = stages.findIndex(
          (s) => s.enabled && s.value === dpi.dpi,
        )
        if (liveMatch >= 0 && liveDpiIdx == null) activeDpiIndex = liveMatch
        else if (stages[activeDpiIndex] && liveMatch < 0) {
          // keep table value; live DPI may differ briefly during shift
        }

        // OMM Assignments: Left/Right/Middle/Back/Forward @ profile offset 32
        const n = Math.min(
          onboard.buttonCount,
          SUPERLIGHT_BUTTONS.length,
          onboard.buttonMacros.length,
        )
        buttons = SUPERLIGHT_BUTTONS.slice(0, n).map((tpl, i) => ({
          ...tpl,
          action: decodeOnboardButtonMacro(onboard.buttonMacros[i]!),
        }))
      } else {
        stages = this.state.sensor.dpiStages.map((s, i) => ({
          ...s,
          value: i === this.state.sensor.activeDpiIndex ? dpi.dpi : s.value,
          color: superlightDpiColor(i),
        }))
        const match = stages.findIndex((s) => s.value === dpi.dpi && s.enabled)
        if (match >= 0) activeDpiIndex = match
      }

      this.state = {
        ...this.state,
        buttons,
        sensor: {
          ...this.state.sensor,
          dpiStages: stages,
          dpiStageCount,
          activeDpiIndex,
          defaultDpiIndex,
          dpiShiftIndex,
          dpiListMin: dpi.listMin,
          dpiListMax: dpi.listMax,
          dpiListStep: dpi.listStep,
          reportRate,
        },
        info: {
          ...this.state.info,
          batteryPercent: batt.percent,
          charging: batt.charging,
          mouseFirmware: fw || name || '-',
          receiverFirmware: 'C547',
          connection: 'wireless',
        },
      }
      this.mouseReachable = true
      this.lastVerifyNote = `SUPERLIGHT · ${reportRate}Hz · DPI ${dpi.dpi} · ${dpiStageCount} slot${
        dpiStageCount === 1 ? '' : 's'
      }${batt.percent != null ? ` · ${batt.percent}%` : ''}${
        name ? ` · ${name}` : ''
      }`
      umdLog('superlight', 'info', 'synced', {
        name,
        fw,
        dpi: dpi.dpi,
        hz: reportRate,
        battery: batt.percent,
        dpiSlots: dpiStageCount,
        onboardRes: onboard?.resolutions,
        buttons: buttons.map((b) => b.action),
      })
    } catch (err) {
      this.mouseReachable = false
      this.lastWriteError = err instanceof Error ? err.message : String(err)
      this.lastVerifyNote =
        'SUPERLIGHT: brak odpowiedzi HID++ - zamknij G HUB/OMM i wybierz interfejs vendor (report 0x11)'
      umdLog('superlight', 'error', 'probe failed', this.lastWriteError)
    }
  }

  async refreshFirmwareVersions() {
    if (this.mock || !this.hid) return
    try {
      const fw = await this.hid.getFwTag()
      const batt = await this.hid.getBattery()
      this.state = {
        ...this.state,
        info: {
          ...this.state.info,
          mouseFirmware: fw,
          batteryPercent: batt.percent,
          charging: batt.charging,
        },
      }
    } catch {
      /* optional */
    }
  }

  async setProfile(index: number) {
    const max = Math.max(0, this.profileCount - 1)
    const i = Math.min(max, Math.max(0, Math.floor(index)))
    // Cancel pending profile patches - they still carry the OLD slot table and would
    // RMW the NEW sector once profileIndex flips (seen clobbering profile 3 with 1-slot data).
    if (this.onboardDpiTimer) {
      clearTimeout(this.onboardDpiTimer)
      this.onboardDpiTimer = null
    }
    if (this.rateTimer) {
      clearTimeout(this.rateTimer)
      this.rateTimer = null
      this.pendingRate = null
    }
    this.profileEpoch++
    const epoch = this.profileEpoch
    // Do NOT set profileIndex until the mouse confirms - otherwise UI lies vs OMM.
    await this.enqueue(async () => {
      if (epoch !== this.profileEpoch) return
      await this.activateOnboardProfile(i + 1)
    })
  }

  private async activateOnboardProfile(sector: number) {
    if (this.mock || !this.hid) {
      this.state = {
        ...this.state,
        profileIndex: Math.max(0, sector - 1),
      }
      return
    }
    this.setWritePhase('writing')
    try {
      await this.hid.setActiveOnboardProfile(sector)
      const got = await this.hid.getActiveOnboardSector()
      const gotId = await this.hid.getActiveOnboardProfileId()
      if (got !== sector || (gotId & 0xff00) === 0x0100) {
        throw new Error(
          `Profil aktywny na myszy to 0x${gotId.toString(16)}, oczekiwano flash ${sector}`,
        )
      }
      await this.probeFlashAndSync()
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = `SUPERLIGHT: profil ${sector} aktywny (0x${gotId.toString(16)})`
      this.setWritePhase('ok')
    } catch (err) {
      this.lastWriteOk = false
      this.lastWriteError = err instanceof Error ? err.message : String(err)
      this.setWritePhase('error')
      umdLog('superlight', 'error', 'profile switch failed', this.lastWriteError)
      try {
        await this.probeFlashAndSync()
      } catch {
        /* ignore */
      }
      throw err instanceof Error ? err : new Error(String(err))
    }
  }

  setButtonAction(buttonId: number, action: ButtonAction) {
    // OMM: Left/Right are not remappable on Superlight.
    if (SUPERLIGHT_LOCKED_BUTTON_IDS.has(buttonId)) return
    this.state = {
      ...this.state,
      buttons: this.state.buttons.map((b) =>
        b.id === buttonId ? { ...b, action } : b,
      ),
    }
    this.queueOnboardDpiWrite()
  }

  patchSensor(patch: Partial<SensorState>) {
    this.state = {
      ...this.state,
      sensor: { ...this.state.sensor, ...patch },
    }
    if (patch.reportRate != null) {
      this.pendingRate = patch.reportRate
      if (this.rateTimer) clearTimeout(this.rateTimer)
      this.rateTimer = setTimeout(() => {
        const hz = this.pendingRate
        this.pendingRate = null
        if (hz == null) return
        const epoch = this.profileEpoch
        void this.enqueue(async () => {
          if (epoch !== this.profileEpoch) return
          await this.writeReportRate(hz)
        })
      }, 180)
    }
  }

  setDpiStageCount(count: number) {
    // OMM DPITable.OnSlotsSelected: enable Order <= selectedIndex (0-based count-1)
    const n = Math.min(
      SUPERLIGHT_DPI_MAX_STAGES,
      Math.max(1, Math.floor(count)),
    )
    const fillDefaults = [800, 1600, 3200, 6400, 12800]
    const stages = this.state.sensor.dpiStages.map((s, i) => {
      const enabled = i < n
      let value = s.value
      if (enabled && (!value || value <= 0)) {
        value = fillDefaults[i] ?? 800
      }
      return { ...s, enabled, value }
    })
    this.state = {
      ...this.state,
      sensor: {
        ...this.state.sensor,
        dpiStageCount: n,
        dpiStages: stages,
        activeDpiIndex: Math.min(this.state.sensor.activeDpiIndex, n - 1),
        defaultDpiIndex: Math.min(this.state.sensor.defaultDpiIndex ?? 0, n - 1),
        dpiShiftIndex: Math.min(this.state.sensor.dpiShiftIndex ?? 0, n - 1),
      },
    }
    this.queueOnboardDpiWrite()
  }

  setDpiStage(index: number, value: number) {
    const dpi = this.clampDpi(value)
    const stages = this.state.sensor.dpiStages.map((s) =>
      s.index === index ? { ...s, value: dpi, enabled: true } : s,
    )
    this.state = {
      ...this.state,
      sensor: { ...this.state.sensor, dpiStages: stages },
    }
    // One queued job writes sector + applies live DPI - avoid parallel 2201 TX mid-write.
    this.queueOnboardDpiWrite()
  }

  /** OMM: „Ustaw jako aktualny DPI” - live slot via 8100 fn12. */
  setActiveDpiSlot(index: number) {
    const max = Math.max(0, (this.state.sensor.dpiStageCount ?? 1) - 1)
    const i = Math.min(max, Math.max(0, Math.floor(index)))
    this.state = {
      ...this.state,
      sensor: { ...this.state.sensor, activeDpiIndex: i },
    }
    void this.enqueue(async () => {
      if (this.mock || !this.hid) return
      this.setWritePhase('writing')
      try {
        await this.hid.setActiveDpiIndex(i)
        const stage = this.state.sensor.dpiStages[i]
        if (stage && stage.value > 0) {
          await this.hid.setDpi(stage.value).catch(() => undefined)
        }
        this.lastWriteOk = true
        this.lastWriteError = null
        this.lastVerifyNote = `SUPERLIGHT: aktywne DPI #${i + 1}`
        this.setWritePhase('ok')
      } catch (err) {
        this.lastWriteOk = false
        this.lastWriteError = err instanceof Error ? err.message : String(err)
        this.setWritePhase('error')
        umdLog('superlight', 'error', 'set active DPI failed', this.lastWriteError)
      }
    })
  }

  /** OMM: „Ustaw jako profil domyślny” - profile byte[1]. */
  setDefaultDpiSlot(index: number) {
    const max = Math.max(0, (this.state.sensor.dpiStageCount ?? 1) - 1)
    const i = Math.min(max, Math.max(0, Math.floor(index)))
    this.state = {
      ...this.state,
      sensor: { ...this.state.sensor, defaultDpiIndex: i },
    }
    this.queueOnboardDpiWrite()
  }

  /** OMM: „Przypisz zmianę DPI” - profile byte[2] (DPI Shift). */
  setDpiShiftSlot(index: number) {
    const max = Math.max(0, (this.state.sensor.dpiStageCount ?? 1) - 1)
    const i = Math.min(max, Math.max(0, Math.floor(index)))
    this.state = {
      ...this.state,
      sensor: { ...this.state.sensor, dpiShiftIndex: i },
    }
    this.queueOnboardDpiWrite()
  }

  /** OMM: „Resetuj” - restore last synced value for one slot. */
  resetDpiSlot(index: number) {
    const i = Math.max(0, Math.floor(index))
    const saved = this.savedResolutions[i] ?? 0
    if (saved <= 0) return
    this.setDpiStage(i, saved)
  }

  private queueOnboardDpiWrite() {
    if (this.onboardDpiTimer) clearTimeout(this.onboardDpiTimer)
    const epoch = this.profileEpoch
    // Debounce past session autosave (450ms) so we don't program the sector twice.
    this.onboardDpiTimer = setTimeout(() => {
      this.onboardDpiTimer = null
      void this.enqueue(async () => {
        if (epoch !== this.profileEpoch) return
        await this.writeOnboardDpiTable()
      })
    }, 520)
  }

  /** Build 5-slot table: enabled → value, trailing disabled → 0 (OMM). */
  private onboardResolutionsFromState(): number[] {
    const n = this.state.sensor.dpiStageCount ?? 1
    return Array.from({ length: SUPERLIGHT_DPI_MAX_STAGES }, (_, i) => {
      if (i >= n) return 0
      const v = this.state.sensor.dpiStages[i]?.value ?? 0
      return v > 0 ? this.clampDpi(v) : 0
    })
  }

  private async writeOnboardDpiTable() {
    if (this.mock || !this.hid) return
    this.setWritePhase('writing')
    try {
      const resolutions = this.onboardResolutionsFromState()
      const rateMs = Math.max(
        1,
        Math.min(8, Math.round(1000 / this.state.sensor.reportRate)),
      )
      // 5 macros @8100 offset 32 - L/R always factory (locked).
      const buttonMacros = SUPERLIGHT_BUTTONS.slice(0, 5).map((tpl, i) => {
        if (SUPERLIGHT_LOCKED_BUTTON_IDS.has(tpl.id)) {
          return encodeOnboardButtonMacro(tpl.id === 1 ? 'left' : 'right')
        }
        const action = this.state.buttons[i]?.action ?? tpl.action
        return encodeOnboardButtonMacro(action)
      })
      await this.hid.writeOnboardDpiAndRate({
        resolutions,
        reportRateMs: rateMs,
        defaultIndex:
          this.state.sensor.defaultDpiIndex ?? this.state.sensor.activeDpiIndex,
        shiftIndex: this.state.sensor.dpiShiftIndex ?? 0,
        buttonMacros,
        // Always patch the profile the mouse is actually on (not optimistic UI index).
        sector: (await this.hid.getActiveOnboardSector()) || this.state.profileIndex + 1,
      })
      // Apply live DPI only after sector write finishes (same HID++ queue).
      const active =
        this.state.sensor.dpiStages[this.state.sensor.activeDpiIndex]
      if (active && active.value > 0) {
        await this.hid.setDpi(active.value)
      }
      const slots = resolutions.filter((v) => v > 0).length
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = `SUPERLIGHT: DPI table → 8100 (${slots} slot${
        slots === 1 ? '' : 's'
      })`
      this.setWritePhase('ok')
    } catch (err) {
      this.lastWriteOk = false
      this.lastWriteError = err instanceof Error ? err.message : String(err)
      this.setWritePhase('error')
      umdLog('superlight', 'error', 'onboard DPI write failed', this.lastWriteError)
    }
  }

  private async writeReportRate(hz: number) {
    if (this.mock || !this.hid) return
    this.setWritePhase('writing')
    try {
      await this.hid.setReportRateHzWithTable(
        hz,
        this.onboardResolutionsFromState(),
        this.state.sensor.defaultDpiIndex ?? this.state.sensor.activeDpiIndex,
        (await this.hid.getActiveOnboardSector()) || this.state.profileIndex + 1,
        this.state.sensor.dpiShiftIndex ?? 0,
      )
      const check = await this.hid.getReportRateHz()
      this.state = {
        ...this.state,
        sensor: { ...this.state.sensor, reportRate: check.hz },
      }
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = `SUPERLIGHT: ${check.hz} Hz → 8100`
      this.setWritePhase('ok')
    } catch (err) {
      this.lastWriteOk = false
      this.lastWriteError = err instanceof Error ? err.message : String(err)
      this.setWritePhase('error')
      umdLog('superlight', 'error', 'rate write failed', this.lastWriteError)
    }
  }

  setMacros(macros: Macro[]) {
    this.state = { ...this.state, macros }
  }

  patchSettings(patch: Partial<SettingsState>) {
    this.state = {
      ...this.state,
      settings: { ...this.state.settings, ...patch },
    }
  }

  restoreDefaults() {
    const keepInfo = this.state.info
    this.state = {
      ...createSuperlightDefaultState(),
      info: keepInfo,
      buttons: SUPERLIGHT_BUTTONS.map((b) => ({ ...b })),
    }
    // Flash OMM factory sectors (directory + profiles 1-5) onto the mouse.
    return this.enqueue(async () => {
      await this.writeFactoryProfilesToDevice()
    })
  }

  /** Write captured OMM factory dump to flash, then re-sync UI. */
  private async writeFactoryProfilesToDevice() {
    if (this.mock || !this.hid) return
    this.setWritePhase('writing')
    try {
      for (const sector of [0, 1, 2, 3, 4, 5]) {
        const data = getSuperlightFactorySector(sector)
        umdLog('superlight', 'info', '8100 write factory sector', { sector })
        await this.hid.writeOnboardSector(sector, data)
        // Let flash settle between sectors (wireless).
        await new Promise((r) => setTimeout(r, 80))
      }
      await this.hid.setActiveOnboardProfile(1)
      await this.probeFlashAndSync()
      this.lastWriteOk = true
      this.lastWriteError = null
      this.lastVerifyNote = 'SUPERLIGHT: fabryczne profile OMM → 8100'
      this.setWritePhase('ok')
    } catch (err) {
      this.lastWriteOk = false
      this.lastWriteError = err instanceof Error ? err.message : String(err)
      this.setWritePhase('error')
      umdLog('superlight', 'error', 'factory restore failed', this.lastWriteError)
      throw err instanceof Error ? err : new Error(String(err))
    }
  }

  exportProfile(): string {
    return JSON.stringify(
      {
        umd: 1,
        device: SUPERLIGHT_IDENTITY.id,
        model: SUPERLIGHT_IDENTITY.model,
        exportedAt: new Date().toISOString(),
        profileIndex: this.state.profileIndex,
        buttons: this.state.buttons,
        sensor: this.state.sensor,
        settings: this.state.settings,
      },
      null,
      2,
    )
  }

  importProfile(json: string) {
    const data = JSON.parse(json) as {
      umd?: number
      device?: string
      buttons?: DeviceState['buttons']
      sensor?: SensorState
      settings?: SettingsState
      profileIndex?: number
    }
    if (data.device && data.device !== SUPERLIGHT_IDENTITY.id) {
      throw new Error('Profile is not for PRO X SUPERLIGHT')
    }
    this.state = {
      ...this.state,
      profileIndex: data.profileIndex ?? this.state.profileIndex,
      buttons: data.buttons ?? this.state.buttons,
      sensor: data.sensor ?? this.state.sensor,
      settings: data.settings ?? this.state.settings,
    }
    void this.enqueue(async () => {
      await this.writeOnboardDpiTable()
    })
  }

  async flushToDevice(): Promise<{ wrote: boolean }> {
    if (this.mock || !this.hid) return { wrote: false }
    // Coalesce with queueOnboardDpiWrite: one sector program, not autosave+debounce.
    if (this.onboardDpiTimer) {
      clearTimeout(this.onboardDpiTimer)
      this.onboardDpiTimer = null
      const epoch = this.profileEpoch
      try {
        await this.enqueue(async () => {
          if (epoch !== this.profileEpoch) return
          await this.writeOnboardDpiTable()
        })
        return { wrote: this.lastWriteOk }
      } catch {
        return { wrote: false }
      }
    }
    // No pending DPI debounce - draft already saved by session; avoid re-flash.
    return { wrote: false }
  }

  /** Exposed for SensorPage rate list after sync. */
  getSupportedReportRates(): number[] {
    return this.supportedRates
  }
}
