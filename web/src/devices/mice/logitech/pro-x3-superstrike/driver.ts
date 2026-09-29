import type { DeviceDriver, DeviceWritePhase } from '../../../DeviceDriver'
import type { Transport } from '../../../../transport/types'
import type { ButtonAction, DeviceState, Macro, SensorState, SettingsState } from '../../../types'
import { createProX3SuperstrikeDefaultState } from './defaults'
import { isProX3SuperstrikeDevice, PRO_X3_SUPERSTRIKE_IDENTITY } from './identity'
import { HidppClient } from '../pro-x-superlight/protocol/hidpp'
import {
  checkHitsWriteGate,
  checkProfileGate,
  decodeButtonRecord,
  decodeGamingSurfaceMode,
  decodeHitsCapabilities,
  decodeHitsButtonConfig,
  decodeOnboardProfilesInfo,
  decodeX3ExtendedDpi,
  decodeX3ExtendedReportRate,
  decodeX3UnifiedBatteryStatus,
  hitsSettingIsInRange,
  hitsUiMax,
  normalizeDpi,
  X3_BHOP_LIMITS,
  patchBunnyHop,
  patchButton,
  patchDpiProfile,
  patchHitsRecord,
  patchProfileRate,
  readBunnyHop,
  readButtonRecord,
  readDpiProfile,
  readHitsRecords,
  readProfileRates,
  resolveX3Variant,
  sectorCrcIsValid,
  encodeGamingSurfaceWrite,
  type HitsButtonSetting,
  type OnboardProfilesInfo,
  type X3ButtonAction,
  type X3GamingSurfaceMode,
  type X3Variant,
} from './protocol'
import { umdLog } from '../../../../debug/umdLog'
import { loadVariantPreference, saveVariantPreference } from './variantPreference'

const HIDPP_FEATURE = {
  BATTERY_UNIFIED: 0x1004,
  HITS: 0x1b0c,
  EXTENDED_DPI: 0x2202,
  EXTENDED_REPORT_RATE: 0x8061,
  /** "Mode Status" - gaming surface + LightForce switch mode (live write, not onboard flash). */
  MODE_STATUS: 0x8090,
} as const

const X3_DPI_PRESETS = [800, 1200, 1600, 2400, 3200] as const

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(max, Math.round(value)))
}

export type X3Message = { en: string; pl: string }
export type X3WriteResult = { wrote: boolean; message: string; messagePl: string }
export type X3OnboardMode = 'onboard' | 'host' | 'unknown'
type ProfileContext = { info: OnboardProfilesInfo; profileId: number; original: Uint8Array }

const sameSetting = (a: HitsButtonSetting, b: HitsButtonSetting) =>
  a.actuationPoint === b.actuationPoint &&
  a.rapidTriggerEnabled === b.rapidTriggerEnabled &&
  a.rapidTriggerSensitivity === b.rapidTriggerSensitivity &&
  a.hapticLevel === b.hapticLevel

const fmtSetting = (s: HitsButtonSetting) =>
  `${s.actuationPoint}/${s.rapidTriggerEnabled ? 'on' : 'off'}/${s.rapidTriggerSensitivity}/${s.hapticLevel}`

const bytesEqual = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((v, i) => v === b[i])

const HOST_MODE_HINT: X3Message = {
  en: 'The mouse stays in host mode (software control). Close Logitech G HUB and any other app using the mouse, then try again.',
  pl: 'Mysz pozostaje w trybie host (sterowanie z oprogramowania). Zamknij Logitech G HUB i inne programy używające myszy, po czym spróbuj ponownie.',
}

const ONBOARD_MODE_HINT: X3Message = {
  en: 'The mouse stayed in onboard mode. Move it, then try switching back to host mode again.',
  pl: 'Mysz pozostała w trybie wbudowanym. Poruszaj nią, po czym spróbuj ponownie przełączyć na tryb host.',
}

/**
 * Clean-room driver. HID++ reads (identity, battery, sensors and HITS
 * capabilities) run freely. HITS settings are persisted into component 0x19
 * of the active onboard profile: the offset comes from profile format 8 (see
 * protocol.ts), and each write is gated and verified by read-back.
 */
export class ProX3SuperstrikeDriver implements DeviceDriver {
  readonly identity = PRO_X3_SUPERSTRIKE_IDENTITY
  readonly capabilities: NonNullable<DeviceDriver['capabilities']> = {
    dpi: true,
    dpiWritable: false,
    reportRate: true,
    reportRateWritable: false,
    buttons: true,
    deviceSettings: false,
    pollRatesHz: [125, 250, 500, 1000, 2000, 4000, 8000],
    statusNote: 'HITS settings are written to the active onboard profile with read-back verification.',
  }
  readonly hitsCapabilities: NonNullable<DeviceDriver['hitsCapabilities']> = {
    featureIndex: null,
    analogButtonsBitfield: null,
    actuationMax: null,
    hapticsMax: null,
    rapidTriggerMax: null,
    source: 'static-analysis',
  }
  readonly protocolDiagnostics: string[] = []
  lastWriteError: string | null = null
  lastWriteOk = false
  lastVerifyNote: string | null = 'X3 - waiting for HID++ session'
  mouseReachable = false
  writePhase: DeviceWritePhase = 'idle'
  private state = createProX3SuperstrikeDefaultState()
  private device: HIDDevice | null = null
  private hidpp: HidppClient | null = null
  private listeners = new Set<(p: DeviceWritePhase) => void>()
  private liveListeners = new Set<(left: number | null, right: number | null) => void>()
  private unsubscribeHitsEvent: (() => void) | null = null

  hitsMonitoring = false
  hitsReadStatus: 'demo' | 'unverified' | 'verified' = 'unverified'
  sensorReadStatus: 'demo' | 'unverified' | 'verified' = 'unverified'
  /** 0x8100 fn2: 'host' means G HUB / software owns the settings and the onboard profile is ignored. */
  onboardMode: X3OnboardMode = 'unknown'
  /** Last summary of the active onboard profile (format, sector, CRC) for Diagnostics. */
  onboardProfileNote: string | null = null
  private writeQueue: Promise<unknown> = Promise.resolve()
  /** True once the active flash profile was read and mirrored into the UI state. */
  profileLoaded = false
  /** Button slots holding a macro / key sequence UMD cannot express: kept untouched. */
  readonly unsupportedButtons = new Set<number>()
  private liveRefresh: ReturnType<typeof setInterval> | null = null
  private liveEventsLogged = 0
  private liveTravelPeak = 0

  /**
   * Writes need a real HID++ session and a verified live read of the current
   * HITS values; the profile-sector gate runs again on every single write.
   */
  get hitsWritesEnabled(): boolean {
    return this.hidpp != null && this.mouseReachable && this.hitsReadStatus === 'verified'
  }
  /** Manual fallback shown when the device doesn't report a confirmed color. */
  caseVariantOverride: Exclude<X3Variant, 'unknown'> | null = loadVariantPreference()

  getState() { return this.state }
  async attach(transport: Transport) { void transport; this.mouseReachable = true; this.hitsReadStatus = 'demo'; this.sensorReadStatus = 'demo' }
  async attachNative(opts?: { preferPid?: number; device?: HIDDevice }) {
    if (!navigator.hid) throw new Error('WebHID is unavailable in this browser')
    const selected = opts?.device ?? (await navigator.hid.getDevices()).find((d) =>
      isProX3SuperstrikeDevice(d.vendorId, d.productId),
    )
    if (!selected) throw new Error('PRO X3 SUPERSTRIKE not authorized in WebHID')
    if (!selected.opened) await selected.open()
    this.device = selected
    this.hitsReadStatus = 'unverified'
    this.sensorReadStatus = 'unverified'
    this.mouseReachable = true
    this.state.info.connection = selected.productId === 0xc0a9 ? 'corded' : 'wireless'
    const vendorCollections = selected.collections.filter((c) => c.usagePage === 0xff43)
    this.protocolDiagnostics.splice(
      0,
      this.protocolDiagnostics.length,
      `VID:PID 046D:${selected.productId.toString(16).padStart(4, '0').toUpperCase()}`,
      `FF43 collections ${vendorCollections.length}`,
      `product ${selected.productName || 'not reported'}`,
    )
    this.lastVerifyNote = `PRO X3 SUPERSTRIKE - ${vendorCollections.length} FF43 collections - read-only identity/battery/HITS`
  }
  async detach() {
    await this.stopHitsLiveMonitoring().catch(() => undefined)
    if (this.hidpp) await this.hidpp.disconnect()
    else if (this.device?.opened) await this.device.close()
    this.hidpp = null
    this.device = null
    this.mouseReachable = false
  }
  onWritePhase(cb: (p: DeviceWritePhase) => void) { this.listeners.add(cb); return () => this.listeners.delete(cb) }
  setProfile(index: number) { this.state.profileIndex = index }
  setButtonAction(buttonId: number, action: ButtonAction) { const b=this.state.buttons.find((x)=>x.id===buttonId); if(b)b.action=action }
  patchSensor(patch: Partial<SensorState>) { Object.assign(this.state.sensor, patch) }
  /** Enables the first `count` of the five onboard DPI slots (unused slots are stored as zeros, like G HUB). */
  setDpiStageCount(count: number) {
    const sensor = this.state.sensor
    const n = Math.max(1, Math.min(X3_DPI_PRESETS.length, Math.round(count)))
    sensor.dpiStages = X3_DPI_PRESETS.map((preset, i) => {
      const prev = sensor.dpiStages[i]
      const enabled = i < n
      const value = enabled ? (prev && prev.value > 0 ? prev.value : preset) : 0
      const valueY = enabled ? (prev && prev.value > 0 && prev.valueY ? prev.valueY : value) : 0
      return { index: i, value, valueY, color: '#70e7ff', enabled }
    })
    sensor.dpiStageCount = n
    if ((sensor.defaultDpiIndex ?? 0) >= n) sensor.defaultDpiIndex = 0
    if ((sensor.dpiShiftIndex ?? 0) >= n) sensor.dpiShiftIndex = 0
  }
  /** Keeps Y linked to X unless the stage was unlinked (Y different from X) before. */
  setDpiStage(index: number, value: number, valueY?: number) {
    const stage = this.state.sensor.dpiStages[index]
    if (!stage || !stage.enabled) return
    const linked = (stage.valueY ?? stage.value) === stage.value
    const x = normalizeDpi(value)
    stage.value = x
    stage.valueY = valueY != null ? normalizeDpi(valueY) : linked ? x : stage.valueY
  }
  setDefaultDpiIndex(index: number) {
    if (this.state.sensor.dpiStages[index]?.enabled) this.state.sensor.defaultDpiIndex = index
  }
  setDpiShiftIndex(index: number) {
    if (this.state.sensor.dpiStages[index]?.enabled) this.state.sensor.dpiShiftIndex = index
  }
  setLodLevel(level: 1 | 2 | 3) { this.state.sensor.lodLevel = level }
  setPollingRate(link: 'wireless' | 'wired', hz: number) {
    if (link === 'wireless') this.state.sensor.reportRateWireless = hz
    else this.state.sensor.reportRateWired = hz
  }
  setBhop(enabled: boolean, timeoutMs?: number) {
    this.state.sensor.bhopEnabled = enabled
    if (timeoutMs != null) {
      this.state.sensor.bhopTimeoutMs = Math.min(X3_BHOP_LIMITS.maxMs, Math.max(X3_BHOP_LIMITS.minMs, Math.round(timeoutMs / X3_BHOP_LIMITS.stepMs) * X3_BHOP_LIMITS.stepMs))
    }
  }
  setMacros(macros: Macro[]) { this.state.macros=macros }
  patchSettings(patch: Partial<SettingsState>) { Object.assign(this.state.settings,patch) }
  restoreDefaults() { this.state=createProX3SuperstrikeDefaultState() }
  exportProfile() { return JSON.stringify({device:this.identity.id,...this.state},null,2) }
  importProfile(json: string) { const v=JSON.parse(json) as Partial<DeviceState> & { device?: string }; if(v.device && v.device!==this.identity.id) throw new Error('Profile is not for PRO X3 SUPERSTRIKE'); this.state={...this.state,...v} as DeviceState }

  /** Real, working local setting - not a device write. Shown as "Wariant obudowy". */
  setCaseVariantOverride(variant: Exclude<X3Variant, 'unknown'>) {
    this.caseVariantOverride = variant
    saveVariantPreference(variant)
  }

  private hitsMax(field: 'actuationMax' | 'hapticsMax' | 'rapidTriggerMax'): number {
    return hitsUiMax(this.hitsCapabilities[field])
  }

  setHitsActuation(button: 'left' | 'right', value: number) {
    const v = clamp(value, this.hitsMax('actuationMax'))
    if (button === 'left') this.state.sensor.hitsLeftActuation = v
    else this.state.sensor.hitsRightActuation = v
  }

  setHitsRapidTrigger(button: 'left' | 'right', enabled: boolean, sensitivity?: number) {
    const key = button === 'left' ? 'hitsLeftRapidTriggerEnabled' : 'hitsRightRapidTriggerEnabled'
    this.state.sensor[key] = enabled
    if (sensitivity != null) {
      const v = clamp(sensitivity, this.hitsMax('rapidTriggerMax'))
      if (button === 'left') this.state.sensor.hitsLeftRapidTriggerSensitivity = v
      else this.state.sensor.hitsRightRapidTriggerSensitivity = v
    }
  }

  setHitsHaptic(button: 'left' | 'right', value: number) {
    const v = clamp(value, this.hitsMax('hapticsMax'))
    if (button === 'left') this.state.sensor.hitsLeftHaptic = v
    else this.state.sensor.hitsRightHaptic = v
  }

  onHitsLiveUpdate(cb: (left: number | null, right: number | null) => void): () => void {
    this.liveListeners.add(cb)
    return () => this.liveListeners.delete(cb)
  }

  /**
   * Safe: feature 0x1B0C fn3 is a session-only broadcast toggle, not a profile
   * write. The mouse stops broadcasting after the 60 s timeout, so - exactly
   * like OMM - the request is repeated every 54 s while the session is open.
   */
  async startHitsLiveMonitoring(): Promise<void> {
    if (!this.hidpp) throw new Error('PRO X3 SUPERSTRIKE is not connected')
    if (this.hitsMonitoring) return
    this.unsubscribeHitsEvent = await this.hidpp.onFeatureEvent(HIDPP_FEATURE.HITS, (_fn, params) => {
      // Only fn 0 is the button_event broadcast; fn 3 is the echo of the monitoring request itself.
      if (_fn !== 0) return
      const leftPresent = ((this.hitsCapabilities.analogButtonsBitfield ?? 0) & 0x01) !== 0
      const rightPresent = ((this.hitsCapabilities.analogButtonsBitfield ?? 0) & 0x02) !== 0
      let cursor = 0
      let left: number | null = null
      let right: number | null = null
      if (leftPresent) left = params[cursor++] ?? null
      if (rightPresent) right = params[cursor++] ?? null
      this.state.sensor.hitsLeftLiveTravel = left ?? undefined
      this.state.sensor.hitsRightLiveTravel = right ?? undefined
      // Dev log: first payloads and every new maximum. Observed on a real X3: full press = 10, the same 0..10 scale as the actuation point.
      const peak = Math.max(left ?? 0, right ?? 0)
      if (this.liveEventsLogged < 3 || peak > this.liveTravelPeak) {
        this.liveEventsLogged++
        this.liveTravelPeak = Math.max(this.liveTravelPeak, peak)
        umdLog('x3', 'info', 'live travel', { fn: _fn, left, right, raw: Array.from(params.slice(0, 16)) })
      }
      for (const cb of this.liveListeners) cb(left, right)
    })
    await this.hidpp.call(HIDPP_FEATURE.HITS, 3, new Uint8Array([1, 60]))
    this.hitsMonitoring = true
    this.liveRefresh = setInterval(() => {
      void this.hidpp?.call(HIDPP_FEATURE.HITS, 3, new Uint8Array([1, 60])).catch(() => undefined)
    }, 54_000)
  }

  async stopHitsLiveMonitoring(): Promise<void> {
    if (this.liveRefresh) clearInterval(this.liveRefresh)
    this.liveRefresh = null
    if (this.hidpp) {
      await this.hidpp.call(HIDPP_FEATURE.HITS, 3, new Uint8Array([0, 0])).catch(() => undefined)
    }
    this.unsubscribeHitsEvent?.()
    this.unsubscribeHitsEvent = null
    this.hitsMonitoring = false
    this.state.sensor.hitsLeftLiveTravel = undefined
    this.state.sensor.hitsRightLiveTravel = undefined
  }

  private notify(phase: DeviceWritePhase) {
    this.writePhase = phase
    for (const cb of this.listeners) cb(phase)
  }

  /** Position among the analog buttons the device reports (left = 0, right = 1 when both exist). */
  private analogIndex(button: 'left' | 'right'): number {
    const mask = this.hitsCapabilities.analogButtonsBitfield ?? 0
    if (button === 'left') return (mask & 0x01) !== 0 ? 0 : -1
    if ((mask & 0x02) === 0) return -1
    return (mask & 0x01) !== 0 ? 1 : 0
  }

  private stagedSetting(button: 'left' | 'right'): HitsButtonSetting | null {
    const s = this.state.sensor
    const [a, e, r, h] = button === 'left'
      ? [s.hitsLeftActuation, s.hitsLeftRapidTriggerEnabled, s.hitsLeftRapidTriggerSensitivity, s.hitsLeftHaptic]
      : [s.hitsRightActuation, s.hitsRightRapidTriggerEnabled, s.hitsRightRapidTriggerSensitivity, s.hitsRightHaptic]
    if (a == null || r == null || h == null) return null
    return { actuationPoint: a, rapidTriggerEnabled: !!e, rapidTriggerSensitivity: r, hapticLevel: h }
  }

  /** 0x1B0C fn2: the values the mouse is applying right now. */
  private async readLiveHits(index: number): Promise<HitsButtonSetting | null> {
    const featureIndex = this.hitsCapabilities.featureIndex
    if (!this.hidpp || featureIndex == null) return null
    try {
      const decoded = decodeHitsButtonConfig(
        await this.hidpp.request(featureIndex, 2, new Uint8Array([index])),
      )
      return decoded && decoded.buttonIndex === index ? decoded : null
    } catch {
      return null
    }
  }

  /**
   * Same call OMM's DisableHostMode makes (0x8100 fn1 = 1). Lets the mouse
   * run its own onboard profile, so Logitech G HUB does not have to be
   * started. If G HUB owns the mouse and flips it back, the caller is told.
   */
  async ensureOnboardMode(): Promise<{ ok: boolean; switched: boolean; message: X3Message | null }> {
    return this.ensureModeIs(1, HOST_MODE_HINT)
  }

  /**
   * Same switch, other direction: back to host mode (G HUB owns the mouse).
   * Onboard-only writes stop applying once this succeeds - use it to hand
   * the mouse back, e.g. before closing UMD and opening G HUB.
   */
  async ensureHostMode(): Promise<{ ok: boolean; switched: boolean; message: X3Message | null }> {
    return this.ensureModeIs(2, ONBOARD_MODE_HINT)
  }

  private async ensureModeIs(
    target: 1 | 2,
    failureHint: X3Message,
  ): Promise<{ ok: boolean; switched: boolean; message: X3Message | null }> {
    const hidpp = this.hidpp
    if (!hidpp) {
      return {
        ok: false,
        switched: false,
        message: { en: 'PRO X3 SUPERSTRIKE is not connected over HID++.', pl: 'PRO X3 SUPERSTRIKE nie jest połączona przez HID++.' },
      }
    }
    let readError = ''
    const readMode = () =>
      hidpp.getOnboardMode().catch((error: unknown) => {
        readError = error instanceof Error ? error.message : String(error)
        return null
      })
    let mode = await readMode()
    let switched = false
    let setError = ''
    if (mode !== target) {
      try {
        await hidpp.setOnboardMode(target)
        switched = true
      } catch (error) {
        setError = error instanceof Error ? error.message : String(error)
      }
      // The mouse may apply the switch slightly after acking (or after a lost ack).
      for (let attempt = 0; attempt < 6; attempt++) {
        mode = await readMode()
        if (mode === target) break
        await new Promise((resolve) => setTimeout(resolve, 350))
      }
    }
    this.onboardMode = mode === 1 ? 'onboard' : mode === 2 ? 'host' : 'unknown'
    const detail = `mode read ${mode ?? 'failed'}${setError ? `, set failed: ${setError}` : ''}${readError ? `, read failed: ${readError}` : ''}`
    this.protocolDiagnostics.push(`mode switch to ${target}: ${detail}`)
    umdLog('x3', 'info', 'mode switch', { target, attempted: switched || setError !== '', detail, finalMode: mode })
    if (switched || setError) void this.logSnapshot('after-mode-switch')
    if (mode === target) return { ok: true, switched, message: null }
    return {
      ok: false,
      switched,
      message: { en: `${failureHint.en} (${detail})`, pl: `${failureHint.pl} (${detail})` },
    }
  }


  /**
   * Read-only snapshot for the dev log (`.umd-debug.log`): raw onboard-mode,
   * profile description, active profile id, directory and active sector, and
   * the live HITS reading. Never called in production builds.
   */
  private async logSnapshot(label: string): Promise<void> {
    const hidpp = this.hidpp
    if (!hidpp || process.env.NODE_ENV === 'production') return
    const hex = (bytes: Uint8Array | null) =>
      bytes ? Array.from(bytes, (v) => v.toString(16).padStart(2, '0')).join('') : null
    try {
      const modeRaw = await hidpp.call(0x8100, 2).catch(() => null)
      const infoRaw = await hidpp.getOnboardProfilesInfoBytes().catch(() => null)
      const profileRaw = await hidpp.call(0x8100, 4).catch(() => null)
      const info = infoRaw ? decodeOnboardProfilesInfo(infoRaw) : null
      const size = info && info.sectorSize >= 64 && info.sectorSize <= 4096 ? info.sectorSize : 255
      const profileId = await hidpp.getActiveOnboardProfileId().catch(() => 0)
      const directory = await hidpp.readOnboardSector(0, size).catch(() => null)
      const active = profileId ? await hidpp.readOnboardSector(profileId, size).catch(() => null) : null
      const liveHits = await Promise.all([0, 1].map(async (i) => {
        const v = await this.readLiveHits(i)
        return v ? fmtSetting(v) : null
      }))
      umdLog('x3', 'info', 'snapshot', {
        label,
        modeRaw: hex(modeRaw),
        infoRaw: hex(infoRaw),
        info,
        profileRaw: hex(profileRaw),
        profileId,
        directory: hex(directory),
        active: hex(active),
        activeCrcOk: active ? sectorCrcIsValid(active) : null,
        hitsLiveLR: liveHits,
      })
    } catch (error) {
      umdLog('x3', 'warn', 'snapshot failed', error instanceof Error ? error.message : String(error))
    }
  }

  /** UI action: switch the mouse to onboard mode without opening G HUB. */
  async switchToOnboardMode(): Promise<X3WriteResult> {
    const result = await this.ensureOnboardMode()
    if (result.ok) await this.loadProfileState()
    const message = result.ok
      ? { en: 'The mouse is in onboard mode - settings from its profile apply.', pl: 'Mysz jest w trybie wbudowanym - działają ustawienia z jej profilu.' }
      : (result.message ?? HOST_MODE_HINT)
    return { wrote: result.ok && result.switched, message: message.en, messagePl: message.pl }
  }

  /**
   * UI action: hand the mouse back to host mode (G HUB / software control).
   * Onboard-only writes (HITS, DPI, polling, BHOP, buttons) stop applying
   * from here once this succeeds - the mouse now takes its settings from
   * whatever host software is running, same as before UMD ever touched it.
   */
  async switchToHostMode(): Promise<X3WriteResult> {
    const result = await this.ensureHostMode()
    const message = result.ok
      ? { en: 'The mouse is back in host mode - close UMD before opening G HUB.', pl: 'Mysz wróciła do trybu host - zamknij UMD przed otwarciem G HUB.' }
      : (result.message ?? ONBOARD_MODE_HINT)
    return { wrote: result.ok && result.switched, message: message.en, messagePl: message.pl }
  }

  /** Read-only hex dump of the active onboard profile sector, for Diagnostics. */
  async captureSectorDump(): Promise<{ sector: number; sectorSize: number; bytes: Uint8Array } | null> {
    if (!this.hidpp) return null
    const raw = await this.hidpp.getOnboardProfilesInfoBytes()
    if (!raw) return null
    const info = decodeOnboardProfilesInfo(raw)
    const profileId = await this.hidpp.getActiveOnboardProfileId()
    const bytes = await this.hidpp.readOnboardSector(profileId, info.sectorSize)
    if (!bytes) return null
    return { sector: profileId, sectorSize: info.sectorSize, bytes }
  }

  private writeFailure(message: X3Message): X3WriteResult {
    this.lastWriteOk = false
    this.lastWriteError = message.en
    umdLog('x3', 'warn', 'profile write failed', message.en)
    this.notify('error')
    return { wrote: false, message: message.en, messagePl: message.pl }
  }

  private queued<T>(job: () => Promise<T>): Promise<T> {
    const run = this.writeQueue.then(job, job)
    this.writeQueue = run.then(() => undefined, () => undefined)
    return run
  }

  /** Writes to the onboard profile need a live HID++ session (demo sessions cannot). */
  get profileWritesEnabled(): boolean {
    return this.hidpp != null && this.mouseReachable
  }

  /**
   * Reads the active flash profile (leaving host mode first if needed) and
   * returns it only when it passed the format / size / CRC gate.
   */
  private async readActiveProfile(switchMode: boolean): Promise<
    { ok: true; ctx: ProfileContext; switched: boolean } | { ok: false; message: X3Message }
  > {
    const hidpp = this.hidpp
    if (!hidpp) {
      return { ok: false, message: { en: 'Not connected over HID++.', pl: 'Brak połączenia HID++.' } }
    }
    const infoBytes = await hidpp.getOnboardProfilesInfoBytes()
    if (!infoBytes) {
      return { ok: false, message: { en: 'The onboard profiles feature (0x8100) is not available.', pl: 'Funkcja profili onboard (0x8100) jest niedostępna.' } }
    }
    const info = decodeOnboardProfilesInfo(infoBytes)
    let switched = false
    if (switchMode) {
      const mode = await this.ensureOnboardMode()
      if (!mode.ok) return { ok: false, message: mode.message ?? HOST_MODE_HINT }
      switched = mode.switched
    }
    const profileId = await hidpp.getActiveOnboardProfileId()
    if (profileId < 1 || profileId > 0xff) {
      return {
        ok: false,
        message: {
          en: 'The active profile is a factory (ROM) profile and cannot be modified. Select or save a user profile once (G HUB / OMM), then try again.',
          pl: 'Aktywny jest profil fabryczny (ROM), którego nie da się zmienić. Wybierz lub zapisz profil użytkownika (G HUB / OMM), po czym spróbuj ponownie.',
        },
      }
    }
    // After leaving host mode let the mouse load its own profile before comparing.
    if (switched) await hidpp.activateOnboardProfile(profileId)
    const original = await hidpp.readOnboardSector(profileId, info.sectorSize)
    if (!original) {
      return { ok: false, message: { en: 'Could not read the active profile sector.', pl: 'Nie udało się odczytać aktywnego sektora profilu.' } }
    }
    const gate = checkProfileGate(info, original)
    if (!gate.ok) return { ok: false, message: { en: gate.reason, pl: gate.reasonPl } }
    return { ok: true, ctx: { info, profileId, original }, switched }
  }

  /** Mirrors the active onboard profile into the UI state (rates, DPI, LOD, BHOP, buttons). */
  private applyProfileToState(sector: Uint8Array) {
    const sensor = this.state.sensor
    const rates = readProfileRates(sector)
    sensor.reportRateWireless = rates.wireless ?? undefined
    sensor.reportRateWired = rates.wired ?? undefined
    const dpi = readDpiProfile(sector)
    sensor.dpiStages = dpi.stages.map((stage, index) => ({
      index,
      value: stage.dpiX,
      valueY: stage.dpiY,
      color: '#70e7ff',
      enabled: stage.dpiX > 0,
    }))
    sensor.dpiStageCount = dpi.stages.filter((stage) => stage.dpiX > 0).length
    sensor.defaultDpiIndex = dpi.defaultIndex
    sensor.dpiShiftIndex = dpi.shiftIndex
    sensor.activeDpiIndex = dpi.defaultIndex
    const lod = dpi.stages.find((stage) => stage.dpiX > 0)?.lod
    sensor.lodLevel = lod === 1 || lod === 2 || lod === 3 ? lod : 2
    const bhop = readBunnyHop(sector)
    sensor.bhopEnabled = bhop.enabled
    sensor.bhopTimeoutMs = bhop.timeoutMs
    this.unsupportedButtons.clear()
    this.state.buttons.forEach((button, i) => {
      const action = decodeButtonRecord(readButtonRecord(sector, i))
      if (action) button.action = action
      else {
        button.action = 'macro'
        this.unsupportedButtons.add(button.id)
      }
    })
    this.profileLoaded = true
  }

  /** Loads the active flash profile into the UI. Never switches mode or writes. */
  async loadProfileState(): Promise<boolean> {
    if (!this.hidpp || this.onboardMode !== 'onboard') {
      this.profileLoaded = false
      return false
    }
    const result = await this.readActiveProfile(false).catch(() => null)
    if (!result || !result.ok) {
      this.profileLoaded = false
      if (result && !result.ok) this.protocolDiagnostics.push(`profile not loaded: ${result.message.en}`)
      return false
    }
    this.applyProfileToState(result.ctx.original)
    this.onboardProfileNote = `format ${result.ctx.info.profileFormat} - profile 0x${result.ctx.profileId.toString(16)} - ${result.ctx.info.sectorSize} B - CRC ok`
    return true
  }

  /**
   * Shared write pipeline: leave host mode, gate the active flash profile,
   * patch, write, read back (exact), re-activate, optionally verify against
   * the mouse's live report. Any mismatch restores the original sector.
   */
  private async runProfileWrite(spec: {
    label: string
    build: (ctx: ProfileContext) => Promise<{ next: Uint8Array } | { refuse: X3Message }>
    verifyApplied?: (ctx: ProfileContext) => Promise<X3Message | null>
    done: X3Message
  }): Promise<X3WriteResult> {
    const hidpp = this.hidpp
    if (!hidpp || !this.mouseReachable) {
      return this.writeFailure({ en: 'No HID++ session (demo mode) - nothing to write to.', pl: 'Brak sesji HID++ (tryb demo) - nie ma dokąd zapisać.' })
    }
    this.notify('writing')
    let ctx: ProfileContext | null = null
    let sectorTouched = false
    const restore = async () => {
      if (!ctx || !sectorTouched) return
      await hidpp.writeOnboardSector(ctx.profileId, ctx.original).catch(() => undefined)
      await hidpp.activateOnboardProfile(ctx.profileId).catch(() => undefined)
    }
    try {
      const read = await this.readActiveProfile(true)
      if (!read.ok) return this.writeFailure(read.message)
      ctx = read.ctx

      const built = await spec.build(ctx)
      if ('refuse' in built) return this.writeFailure(built.refuse)
      if (bytesEqual(built.next, ctx.original)) {
        this.applyProfileToState(ctx.original)
        this.lastWriteOk = true
        this.lastWriteError = null
        this.notify('ok')
        return { wrote: false, message: 'Already stored on the mouse.', messagePl: 'Ta wartość jest już zapisana w myszy.' }
      }

      sectorTouched = true
      await hidpp.writeOnboardSector(ctx.profileId, built.next)
      const readBack = await hidpp.readOnboardSector(ctx.profileId, ctx.info.sectorSize)
      if (!readBack || !bytesEqual(readBack, built.next)) {
        await restore()
        return this.writeFailure({
          en: 'Read-back did not match after writing - the previous profile sector was restored.',
          pl: 'Odczyt po zapisie nie zgadza się - przywrócono poprzedni sektor profilu.',
        })
      }

      // OMM re-activates the sector after writing the current profile.
      await hidpp.activateOnboardProfile(ctx.profileId)
      const mismatch = spec.verifyApplied ? await spec.verifyApplied(ctx) : null
      if (mismatch) {
        await restore()
        return this.writeFailure(mismatch)
      }

      this.applyProfileToState(built.next)
      this.onboardProfileNote = `format ${ctx.info.profileFormat} - profile 0x${ctx.profileId.toString(16)} - ${ctx.info.sectorSize} B - CRC ok`
      umdLog('x3', 'info', 'profile write ok', { label: spec.label, profileId: ctx.profileId })
      this.lastWriteOk = true
      this.lastWriteError = null
      this.notify('ok')
      return { wrote: true, message: spec.done.en, messagePl: spec.done.pl }
    } catch (error) {
      await restore()
      const detail = error instanceof Error ? error.message : String(error)
      return this.writeFailure({
        en: `Write failed: ${detail}${sectorTouched ? ' (the previous profile sector was restored)' : ''}`,
        pl: `Zapis nie powiódł się: ${detail}${sectorTouched ? ' (przywrócono poprzedni sektor profilu)' : ''}`,
      })
    }
  }

  /**
   * Gaming surface (HID++ feature 0x8090) is a live device write, not part
   * of the onboard profile flash - read-modify-write the shared modeStatus1
   * byte, then read back and confirm, same as OpenMouse's setModeStatus.
   */
  commitGamingSurfaceMode(mode: X3GamingSurfaceMode): Promise<X3WriteResult> {
    return this.queued(() => this.writeGamingSurfaceNow(mode))
  }

  private async writeGamingSurfaceNow(mode: X3GamingSurfaceMode): Promise<X3WriteResult> {
    const hidpp = this.hidpp
    if (!hidpp || !this.mouseReachable) {
      return this.writeFailure({
        en: 'Not connected over HID++.',
        pl: 'Brak połączenia HID++.',
      })
    }
    try {
      const idx = await hidpp.getFeature(HIDPP_FEATURE.MODE_STATUS)
      if (idx == null) {
        return this.writeFailure({
          en: 'This mouse does not expose gaming-surface controls.',
          pl: 'Ta mysz nie udostępnia sterowania powierzchnią gamingową.',
        })
      }
      // modeStatus1 (the byte gaming surface/LightForce live in) is payload
      // byte index 1, not 4: OpenMouse's own reply[4] is measured against
      // their *unsliced* report (header still at indices 0-2, so index 4 is
      // payload byte 1), but our HidppClient.request() already strips the
      // 3-byte header before resolving - copying their index literally read
      // past the real payload and decoded as 0 (Auto) regardless of the
      // mouse's actual state.
      const before = await hidpp.request(idx, 0)
      const currentByte = before[1] ?? 0
      if (decodeGamingSurfaceMode(currentByte) === mode) {
        this.state.sensor.gamingSurfaceMode = mode
        this.lastWriteOk = true
        this.lastWriteError = null
        this.notify('ok')
        return { wrote: false, message: 'Already set on the mouse.', messagePl: 'Ta wartość jest już ustawiona w myszy.' }
      }
      await hidpp.request(idx, 1, encodeGamingSurfaceWrite(currentByte, mode))
      const after = await hidpp.request(idx, 0)
      const confirmed = decodeGamingSurfaceMode(after[1] ?? 0)
      if (confirmed !== mode) {
        return this.writeFailure({
          en: `The mouse kept ${confirmed ?? 'an unknown'} gaming surface mode instead of ${mode}.`,
          pl: `Mysz zachowała tryb ${confirmed ?? 'nieznany'} zamiast ${mode}.`,
        })
      }
      this.state.sensor.gamingSurfaceMode = mode
      this.lastWriteOk = true
      this.lastWriteError = null
      this.notify('ok')
      return {
        wrote: true,
        message: `Gaming surface set to ${mode} and verified by read-back.`,
        messagePl: `Powierzchnia gamingowa ustawiona na ${mode} i potwierdzona odczytem zwrotnym.`,
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      return this.writeFailure({
        en: `Gaming surface write failed: ${detail}`,
        pl: `Zapis powierzchni gamingowej nie powiódł się: ${detail}`,
      })
    }
  }

  /**
   * Persists one analog button's HITS settings into component 0x19 of the
   * active onboard profile (offset fixed by profile format 8 - see
   * protocol.ts); the value must also match the mouse's live report.
   */
  writeHitsToDevice(button: 'left' | 'right'): Promise<X3WriteResult> {
    return this.queued(() => this.writeHitsNow(button))
  }

  private async writeHitsNow(button: 'left' | 'right'): Promise<X3WriteResult> {
    if (this.hitsReadStatus !== 'verified') {
      return this.writeFailure({
        en: 'The current HITS values were not read from the mouse, so nothing is written.',
        pl: 'Aktualne wartości HITS nie zostały odczytane z myszy, więc nic nie zapisuję.',
      })
    }
    const caps = this.hitsCapabilities
    const index = this.analogIndex(button)
    const setting = this.stagedSetting(button)
    if (index < 0 || !setting || caps.actuationMax == null || caps.rapidTriggerMax == null || caps.hapticsMax == null) {
      return this.writeFailure({ en: 'This analog button is not available on the device.', pl: 'Ten przycisk analogowy nie jest dostępny w urządzeniu.' })
    }
    const limits = { actuationMax: caps.actuationMax, rapidTriggerMax: caps.rapidTriggerMax, hapticsMax: caps.hapticsMax }
    if (!hitsSettingIsInRange(setting, limits)) {
      return this.writeFailure({ en: 'The value is outside the range the device supports.', pl: 'Wartość jest poza zakresem obsługiwanym przez urządzenie.' })
    }
    return this.runProfileWrite({
      label: `hits-${button}`,
      build: async ({ info, original }) => {
        const gate = checkHitsWriteGate(info, original, limits)
        if (!gate.ok) return { refuse: { en: gate.reason, pl: gate.reasonPl } }
        const stored = readHitsRecords(original)[index]!
        const live = await this.readLiveHits(index)
        if (live && !sameSetting(live, stored)) {
          return {
            refuse: {
              en: `The profile sector holds ${fmtSetting(stored)} but the mouse reports ${fmtSetting(live)} - not writing until they agree.`,
              pl: `Sektor profilu zawiera ${fmtSetting(stored)}, a mysz zgłasza ${fmtSetting(live)} - nie zapisuję, dopóki się nie zgadzają.`,
            },
          }
        }
        return { next: patchHitsRecord(original, index, setting) }
      },
      verifyApplied: async () => {
        const liveAfter = await this.readLiveHits(index)
        if (liveAfter && !sameSetting(liveAfter, setting)) {
          return {
            en: `Stored, but the mouse applies ${fmtSetting(liveAfter)} instead of ${fmtSetting(setting)} - the previous profile sector was restored.`,
            pl: `Zapisano, ale mysz stosuje ${fmtSetting(liveAfter)} zamiast ${fmtSetting(setting)} - przywrócono poprzedni sektor profilu.`,
          }
        }
        return null
      },
      done: {
        en: `${button === 'left' ? 'Left' : 'Right'} button saved to the mouse (${fmtSetting(setting)}) and verified by read-back.`,
        pl: `${button === 'left' ? 'Lewy' : 'Prawy'} przycisk zapisany w myszy (${fmtSetting(setting)}) i potwierdzony odczytem zwrotnym.`,
      },
    })
  }

  private refuseWith(error: unknown): { refuse: X3Message } {
    const detail = error instanceof Error ? error.message : String(error)
    return { refuse: { en: detail, pl: detail } }
  }

  /** DPI stages, default / shift index and LOD (one shared LOD, like OMM). */
  commitDpi(): Promise<X3WriteResult> {
    return this.queued(() =>
      this.runProfileWrite({
        label: 'dpi',
        build: async ({ original }) => {
          const sensor = this.state.sensor
          const lod = sensor.lodLevel ?? 2
          try {
            return {
              next: patchDpiProfile(original, {
                defaultIndex: sensor.defaultDpiIndex ?? 0,
                shiftIndex: sensor.dpiShiftIndex ?? 0,
                stages: sensor.dpiStages.map((stage) =>
                  stage.enabled && stage.value > 0
                    ? { dpiX: stage.value, dpiY: stage.valueY ?? stage.value, lod }
                    : { dpiX: 0, dpiY: 0, lod: 0 },
                ),
              }),
            }
          } catch (error) {
            return this.refuseWith(error)
          }
        },
        done: { en: 'DPI settings saved to the mouse and verified by read-back.', pl: 'Ustawienia DPI zapisane w myszy i potwierdzone odczytem zwrotnym.' },
      }),
    )
  }

  /** Polling rate over the LIGHTSPEED link and over the cable. */
  commitRates(): Promise<X3WriteResult> {
    return this.queued(() =>
      this.runProfileWrite({
        label: 'rates',
        build: async ({ original }) => {
          const { reportRateWireless, reportRateWired } = this.state.sensor
          try {
            let next = original
            if (reportRateWireless) next = patchProfileRate(next, 'wireless', reportRateWireless)
            if (reportRateWired) next = patchProfileRate(next, 'wired', reportRateWired)
            return { next }
          } catch (error) {
            return this.refuseWith(error)
          }
        },
        done: { en: 'Polling rates saved to the mouse and verified by read-back.', pl: 'Częstotliwości odpytywania zapisane w myszy i potwierdzone odczytem zwrotnym.' },
      }),
    )
  }

  /** Bunny-hop (BHOP) on/off and timeout. */
  commitBhop(): Promise<X3WriteResult> {
    return this.queued(() =>
      this.runProfileWrite({
        label: 'bhop',
        build: async ({ original }) => ({
          next: patchBunnyHop(original, {
            enabled: !!this.state.sensor.bhopEnabled,
            timeoutMs: this.state.sensor.bhopTimeoutMs ?? 100,
          }),
        }),
        done: { en: 'BHOP saved to the mouse and verified by read-back.', pl: 'BHOP zapisany w myszy i potwierdzony odczytem zwrotnym.' },
      }),
    )
  }

  /** One button assignment (buttons 1-5 = onboard slots 0-4). */
  commitButton(buttonId: number): Promise<X3WriteResult> {
    return this.queued(() =>
      this.runProfileWrite({
        label: `button-${buttonId}`,
        build: async ({ original }) => {
          const button = this.state.buttons.find((b) => b.id === buttonId)
          if (!button) return this.refuseWith(new Error(`Unknown button ${buttonId}`))
          if (this.unsupportedButtons.has(buttonId) && button.action === 'macro') {
            return { next: original }
          }
          try {
            return { next: patchButton(original, button.flashIndex, button.action as X3ButtonAction) }
          } catch (error) {
            return this.refuseWith(error)
          }
        },
        done: { en: 'Button assignment saved to the mouse and verified by read-back.', pl: 'Przypisanie przycisku zapisane w myszy i potwierdzone odczytem zwrotnym.' },
      }),
    )
  }

  async refreshFirmwareVersions() {
    if (!this.hidpp) return
    try {
      const fw = await this.hidpp.getFwTag()
      if (fw && fw !== '-') this.state.info.mouseFirmware = fw
    } catch (error) {
      this.protocolDiagnostics.push(`firmware read: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  async probeFlashAndSync() {
    if (!this.mouseReachable || !this.device) throw new Error('PRO X3 SUPERSTRIKE is not connected')
    const fresh = this.hidpp == null
    const hidpp = this.hidpp ?? new HidppClient()
    this.hidpp = hidpp
    try {
      if (fresh) await hidpp.attachSelectedDevice(this.device, this.device.productId === 0xc0a9 ? 0xff : 0x01)
      const protocol = await hidpp.ping()
      this.protocolDiagnostics.push(`HID++ ${protocol.major}.${protocol.minor}`)

      const [deviceInfo, name] = await Promise.all([
        hidpp.getDeviceInfo(),
        hidpp.getDeviceName().catch(() => ''),
      ])
      const variant = resolveX3Variant(deviceInfo.modelIdHex)
      Object.assign(this.state.info, {
        modelIdHex: deviceInfo.modelIdHex,
        extendedModelId: deviceInfo.extendedModelId,
        colorVariant: variant,
        identityDiagnostic:
          variant === 'unknown'
            ? `Model ${deviceInfo.modelIdHex || 'not reported'} is not mapped to a confirmed color SKU`
            : `Color resolved from confirmed HID++ model mapping`,
      })
      this.protocolDiagnostics.push(
        `feature 0x0003 model ${deviceInfo.modelIdHex || 'empty'} ext ${deviceInfo.extendedModelId}`,
      )
      this.hitsReadStatus = 'unverified'

      const batteryIndex = await hidpp.getFeature(HIDPP_FEATURE.BATTERY_UNIFIED)
      if (batteryIndex != null) {
        const reading = decodeX3UnifiedBatteryStatus(await hidpp.request(batteryIndex, 1))
        Object.assign(this.state.info, {
          batteryPercent: reading.percent,
          charging: reading.charging,
          batteryState: reading.state,
          batteryStatusCode: reading.statusCode,
        })
        this.protocolDiagnostics.push(`feature 0x1004 index ${batteryIndex}`)
      } else {
        this.protocolDiagnostics.push('feature 0x1004 absent')
      }

      // X3 uses the extended sensor/rate features. These are read-only here:
      // live setters are not a trustworthy persistence/read-back mechanism.
      let sensorFieldsRead = 0
      const dpiIndex = await hidpp.getFeature(HIDPP_FEATURE.EXTENDED_DPI)
      if (dpiIndex != null) {
        try {
          const dpi = decodeX3ExtendedDpi(await hidpp.request(dpiIndex, 5, new Uint8Array([0])))
          if (dpi.dpiX != null) {
            this.state.sensor.dpiStages = [{
              index: 0,
              value: dpi.dpiX,
              valueY: dpi.dpiY ?? dpi.dpiX,
              color: '#70e7ff',
              enabled: true,
            }]
            this.state.sensor.dpiStageCount = 1
            this.state.sensor.activeDpiIndex = 0
            sensorFieldsRead++
          } else {
            this.state.sensor.dpiStages = []
            this.state.sensor.dpiStageCount = 0
          }
          this.state.sensor.lodLevel = dpi.lodLevel ?? undefined
          if (dpi.lodLevel != null) sensorFieldsRead++
          this.protocolDiagnostics.push(
            `feature 0x2202 index ${dpiIndex} dpi ${dpi.dpiX ?? 'unknown'} lod ${dpi.lodLevel ?? 'unknown'}`,
          )
        } catch (error) {
          this.state.sensor.dpiStages = []
          this.state.sensor.dpiStageCount = 0
          this.state.sensor.lodLevel = undefined
          this.protocolDiagnostics.push(`feature 0x2202 read failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      } else {
        this.state.sensor.dpiStages = []
        this.state.sensor.dpiStageCount = 0
        this.state.sensor.lodLevel = undefined
        this.protocolDiagnostics.push('feature 0x2202 absent')
      }

      const rateIndex = await hidpp.getFeature(HIDPP_FEATURE.EXTENDED_REPORT_RATE)
      if (rateIndex != null) {
        try {
          const rate = decodeX3ExtendedReportRate(await hidpp.request(rateIndex, 2))
          this.state.sensor.reportRate = rate ?? 0
          if (rate != null) sensorFieldsRead++
          this.protocolDiagnostics.push(`feature 0x8061 index ${rateIndex} rate ${rate ?? 'unknown'}`)
        } catch (error) {
          this.state.sensor.reportRate = 0
          this.protocolDiagnostics.push(`feature 0x8061 read failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      } else {
        this.state.sensor.reportRate = 0
        this.protocolDiagnostics.push('feature 0x8061 absent')
      }

      const modeStatusIndex = await hidpp.getFeature(HIDPP_FEATURE.MODE_STATUS)
      if (modeStatusIndex != null) {
        try {
          const resp = await hidpp.request(modeStatusIndex, 0)
          const mode = decodeGamingSurfaceMode(resp[1] ?? 0)
          this.state.sensor.gamingSurfaceMode = mode ?? undefined
          this.protocolDiagnostics.push(`feature 0x8090 index ${modeStatusIndex} gaming surface ${mode ?? 'unknown'}`)
        } catch (error) {
          this.state.sensor.gamingSurfaceMode = undefined
          this.protocolDiagnostics.push(`feature 0x8090 read failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      } else {
        this.state.sensor.gamingSurfaceMode = undefined
        this.protocolDiagnostics.push('feature 0x8090 absent')
      }
      this.sensorReadStatus = sensorFieldsRead > 0 ? 'verified' : 'unverified'

      const hitsIndex = await hidpp.getFeature(HIDPP_FEATURE.HITS)
      Object.assign(this.hitsCapabilities, { featureIndex: hitsIndex })
      if (hitsIndex != null) {
        const cap = decodeHitsCapabilities(await hidpp.request(hitsIndex, 0))
        Object.assign(this.hitsCapabilities, {
          analogButtonsBitfield: (cap.leftPresent ? 0x01 : 0) | (cap.rightPresent ? 0x02 : 0),
          actuationMax: cap.actuationMax,
          hapticsMax: cap.hapticsMax,
          rapidTriggerMax: cap.rapidTriggerMax,
          source: 'device',
        })
        const actuationUiMax = hitsUiMax(cap.actuationMax)
        const hapticsUiMax = hitsUiMax(cap.hapticsMax)
        const rapidTriggerUiMax = hitsUiMax(cap.rapidTriggerMax)
        this.state.sensor.hitsLeftActuation = clamp(this.state.sensor.hitsLeftActuation ?? 0, actuationUiMax)
        this.state.sensor.hitsRightActuation = clamp(this.state.sensor.hitsRightActuation ?? 0, actuationUiMax)
        this.state.sensor.hitsLeftRapidTriggerSensitivity = clamp(
          this.state.sensor.hitsLeftRapidTriggerSensitivity ?? 0,
          rapidTriggerUiMax,
        )
        this.state.sensor.hitsRightRapidTriggerSensitivity = clamp(
          this.state.sensor.hitsRightRapidTriggerSensitivity ?? 0,
          rapidTriggerUiMax,
        )
        this.state.sensor.hitsLeftHaptic = clamp(this.state.sensor.hitsLeftHaptic ?? 0, hapticsUiMax)
        this.state.sensor.hitsRightHaptic = clamp(this.state.sensor.hitsRightHaptic ?? 0, hapticsUiMax)
        this.protocolDiagnostics.push(
          `feature 0x1B0C index ${hitsIndex} mask 0x${this.hitsCapabilities.analogButtonsBitfield!.toString(16)} ` +
            `actuation ${cap.actuationMax} haptic ${cap.hapticsMax} rt ${cap.rapidTriggerMax}`,
        )

        const configs = await Promise.all(
          [0, 1].map(async (buttonIndex) => {
            try {
              const raw = await hidpp.request(hitsIndex, 2, new Uint8Array([buttonIndex]))
              const decoded = decodeHitsButtonConfig(raw)
              if (!decoded || decoded.buttonIndex !== buttonIndex) {
                this.protocolDiagnostics.push(
                  `feature 0x1B0C fn2 button ${buttonIndex} rejected raw ${Array.from(raw.slice(0, 4), (v) => v.toString(16).padStart(2, '0')).join(' ')}`,
                )
                return null
              }
              return decoded
            } catch (error) {
              this.protocolDiagnostics.push(
                `feature 0x1B0C fn2 button ${buttonIndex} failed: ${error instanceof Error ? error.message : String(error)}`,
              )
              return null
            }
          }),
        )
        const [leftConfig, rightConfig] = configs
        const configValid = (config: typeof leftConfig) => config != null &&
          config.actuationPoint >= 1 && config.actuationPoint <= actuationUiMax &&
          config.rapidTriggerSensitivity >= 1 && config.rapidTriggerSensitivity <= rapidTriggerUiMax &&
          config.hapticLevel >= 0 && config.hapticLevel <= hapticsUiMax
        if (configValid(leftConfig) && configValid(rightConfig)) {
          Object.assign(this.state.sensor, {
            hitsLeftActuation: leftConfig!.actuationPoint,
            hitsRightActuation: rightConfig!.actuationPoint,
            hitsLeftRapidTriggerEnabled: leftConfig!.rapidTriggerEnabled,
            hitsRightRapidTriggerEnabled: rightConfig!.rapidTriggerEnabled,
            hitsLeftRapidTriggerSensitivity: leftConfig!.rapidTriggerSensitivity,
            hitsRightRapidTriggerSensitivity: rightConfig!.rapidTriggerSensitivity,
            hitsLeftHaptic: leftConfig!.hapticLevel,
            hitsRightHaptic: rightConfig!.hapticLevel,
          })
          this.hitsReadStatus = 'verified'
          this.protocolDiagnostics.push(
            `feature 0x1B0C fn2 L ${leftConfig!.actuationPoint}/${leftConfig!.rapidTriggerEnabled ? 'on' : 'off'}/${leftConfig!.rapidTriggerSensitivity}/${leftConfig!.hapticLevel} ` +
              `R ${rightConfig!.actuationPoint}/${rightConfig!.rapidTriggerEnabled ? 'on' : 'off'}/${rightConfig!.rapidTriggerSensitivity}/${rightConfig!.hapticLevel}`,
          )
        }

        if (this.hitsReadStatus !== 'verified') {
          Object.assign(this.state.sensor, {
            hitsLeftActuation: undefined,
            hitsRightActuation: undefined,
            hitsLeftRapidTriggerEnabled: undefined,
            hitsRightRapidTriggerEnabled: undefined,
            hitsLeftRapidTriggerSensitivity: undefined,
            hitsRightRapidTriggerSensitivity: undefined,
            hitsLeftHaptic: undefined,
            hitsRightHaptic: undefined,
          })
          this.protocolDiagnostics.push('HITS fn2 unavailable; HITS writes stay disabled')
        }
      } else {
        this.protocolDiagnostics.push('feature 0x1B0C absent')
      }

      // Read-only: 'host' means G HUB (or another app) owns the settings.
      const modeRaw = await hidpp.getOnboardMode().catch(() => null)
      this.onboardMode = modeRaw === 1 ? 'onboard' : modeRaw === 2 ? 'host' : 'unknown'
      const infoRaw = await hidpp.getOnboardProfilesInfoBytes().catch(() => null)
      if (infoRaw) {
        const info = decodeOnboardProfilesInfo(infoRaw)
        this.onboardProfileNote = `format ${info.profileFormat} - ${info.sectorSize} B sectors - ${info.profileCount} profiles`
        this.protocolDiagnostics.push(
          `feature 0x8100 mode ${modeRaw ?? 'unknown'} format ${info.profileFormat} sector ${info.sectorSize} profiles ${info.profileCount}`,
        )
      }

      if (this.onboardMode === 'onboard') await this.loadProfileState()
      else this.profileLoaded = false
      if (this.hitsReadStatus === 'verified' && this.hitsCapabilities.featureIndex != null) {
        await this.startHitsLiveMonitoring().catch((error: unknown) => {
          this.protocolDiagnostics.push(`live preview: ${error instanceof Error ? error.message : String(error)}`)
        })
      }
      await this.logSnapshot('probe')

      this.lastVerifyNote = `PRO X3 SUPERSTRIKE - HID++ ${protocol.major}.${protocol.minor}${
        this.state.info.batteryPercent != null ? ` - ${this.state.info.batteryPercent}%` : ''
      }${name ? ` - ${name}` : ''} - HITS ${this.hitsReadStatus === 'verified' ? 'read verified' : 'values unresolved'} - ${this.onboardMode === 'host' ? 'host mode (G HUB)' : this.onboardMode === 'onboard' ? 'onboard mode' : 'mode unknown'}`
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.protocolDiagnostics.push(`read path: ${message}`)
      this.lastVerifyNote = `PRO X3 SUPERSTRIKE detected - HID++ read unavailable: ${message}`
    }
  }
  /** HITS values are committed explicitly through writeHitsToDevice(); nothing is autosaved. */
  async flushToDevice() {
    return { wrote: false }
  }
}
