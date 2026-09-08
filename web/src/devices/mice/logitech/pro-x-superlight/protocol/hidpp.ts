import { umdLog } from '../../../../../debug/umdLog'
import { getSuperlightFactorySector } from '../factoryProfiles'
import {
  DEFAULT_DEVICE_INDEX,
  HIDPP,
  REPORT_LONG,
} from './constants'
import { isSuperlightDevice, superlightHidFilters } from '../identity'

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/** CRC-16/CCITT-FALSE (Solaar `common.crc16`) - used by onboard profile sectors. */
export function crc16Ccitt(data: Uint8Array): number {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]! << 8
    for (let b = 0; b < 8; b++) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xffff
      else crc = (crc << 1) & 0xffff
    }
  }
  return crc & 0xffff
}

/**
 * True if sector looks like a usable onboard profile (not erased / mid-write trash).
 * ROM profiles often have CRC 0xFFFF - still accepted when header/buttons look sane.
 * CRC mismatch alone is soft: prefer structural checks (rate / DPI / L button).
 */
export function isValidOnboardProfileBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 52) return false
  const rate = bytes[0] ?? 0
  if (rate < 1 || rate > 8) return false
  const def = bytes[1] ?? 0xff
  if (def > 4) return false
  for (let i = 0; i < 5; i++) {
    const v = bytes[3 + i * 2]! | (bytes[3 + i * 2 + 1]! << 8)
    if (v !== 0 && (v < 50 || v > 30000)) return false
  }
  // Left button = SEND BUTTON mask 0x0001
  if (bytes[32] !== 0x80 || bytes[33] !== 0x01 || bytes[35] !== 0x01) {
    return false
  }
  return true
}

function assertWebHid(): HID {
  if (!navigator.hid) {
    throw new Error('WebHID unavailable - use Chrome/Edge on umdrivers.com')
  }
  return navigator.hid
}

function reportPayloadBytes(report: HIDReportInfo): number {
  let bits = 0
  for (const item of report.items ?? []) {
    bits += (item.reportSize ?? 0) * (item.reportCount ?? 0)
  }
  return Math.ceil(bits / 8)
}

/** Prefer Col02: usagePage FF00 / usage 02 / output report 0x11 (~19 B payload). */
export function scoreHidppLongDevice(device: HIDDevice): number {
  let score = 0
  if (!isSuperlightDevice(device.vendorId, device.productId)) return -1
  score += 100
  for (const c of device.collections ?? []) {
    if (c.usagePage === 0xff00 && c.usage === 0x02) score += 200
    else if (c.usagePage === 0xff00) score += 40
    for (const r of c.outputReports ?? []) {
      if (r.reportId === REPORT_LONG) {
        score += 80
        if (reportPayloadBytes(r) >= 19) score += 40
      }
    }
    for (const r of c.inputReports ?? []) {
      if (r.reportId === REPORT_LONG) score += 30
    }
  }
  return score
}

export type HidppBattery = {
  percent: number | null
  nextLevel: number | null
  status: number
  charging: boolean
}

export type HidppDpiInfo = {
  dpi: number
  defaultDpi: number
  listMin: number
  listMax: number
  listStep: number
}

/** Onboard profile (OMM / Solaar format ≤5). */
export type OnboardDpiTable = {
  sector: number
  reportRateMs: number
  defaultIndex: number
  shiftIndex: number
  /** Always length 5; 0 means slot disabled (OMM `Enabled = value != 0`). */
  resolutions: number[]
  enabledCount: number
  activeIndex: number
  /** button_count from GetOnboardProfilesInfo (Superlight v1 = 5). */
  buttonCount: number
  /** Raw 4-byte macros @ profile offset 32 (length = buttonCount). */
  buttonMacros: Uint8Array[]
  /** profile_count from GetOnboardProfilesInfo. */
  profileCount: number
}

export type OnboardProfileInfo = {
  profileCount: number
  sectorSize: number
  buttonCount: number
  /** Enabled profile sectors from directory (usually 1..N). */
  sectors: number[]
  activeSector: number
}

/**
 * Minimal HID++ 2.0 client over the LIGHTSPEED long collection (report 0x11).
 * Close G HUB / OMM before connect - exclusive open.
 */
export class HidppClient {
  private device: HIDDevice | null = null
  private deviceIndex = DEFAULT_DEVICE_INDEX
  private swId = 0x0d
  private featureMap = new Map<number, number>([[HIDPP.ROOT, 0]])
  private pending: Array<{
    featureIndex: number
    swId: number
    resolve: (params: Uint8Array) => void
    reject: (err: Error) => void
    timer: ReturnType<typeof setTimeout>
  }> = []
  /** Serialize all HID++ traffic - concurrent WebHID TX drops LIGHTSPEED replies. */
  private requestChain: Promise<unknown> = Promise.resolve()
  private onInputBound: (ev: HIDInputReportEvent) => void

  constructor() {
    this.onInputBound = (ev) => this.onInput(ev)
  }

  get connectedDevice(): HIDDevice | null {
    return this.device
  }

  async connect(opts?: { interactive?: boolean; preferPid?: number }) {
    const hid = assertWebHid()
    const filters = superlightHidFilters()
    let pool = (await hid.getDevices()).filter((d) =>
      isSuperlightDevice(d.vendorId, d.productId),
    )

    if (opts?.preferPid != null) {
      const prefer = pool.filter((d) => d.productId === opts.preferPid)
      if (prefer.length) pool = prefer
    }

    pool = [...pool].sort(
      (a, b) => scoreHidppLongDevice(b) - scoreHidppLongDevice(a),
    )

    let selected = pool.find((d) => scoreHidppLongDevice(d) >= 200) ?? pool[0]

    if (!selected || scoreHidppLongDevice(selected) < 100) {
      if (opts?.interactive === false) {
        throw new Error('Brak autoryzowanego odbiornika Superlight (046D:C547)')
      }
      const picked = await hid.requestDevice({ filters })
      const ranked = [...picked]
        .filter((d) => isSuperlightDevice(d.vendorId, d.productId))
        .sort((a, b) => scoreHidppLongDevice(b) - scoreHidppLongDevice(a))
      selected = ranked[0]
    }

    if (!selected) {
      throw new Error('Nie wybrano PRO X SUPERLIGHT (odbiornik C547)')
    }

    if (!selected.opened) await selected.open()
    selected.addEventListener('inputreport', this.onInputBound)
    this.device = selected
    this.featureMap = new Map([[HIDPP.ROOT, 0]])

    umdLog('superlight', 'info', 'hidpp open', {
      productId: selected.productId.toString(16),
      productName: selected.productName,
      score: scoreHidppLongDevice(selected),
    })

    // Prove link
    const proto = await this.request(0, 1, new Uint8Array([0x00, 0x00, 0x88]))
    umdLog('superlight', 'info', 'protocol', {
      major: proto[0],
      minor: proto[1],
    })
  }

  async disconnect() {
    const d = this.device
    this.device = null
    for (const p of this.pending) {
      clearTimeout(p.timer)
      p.reject(new Error('disconnected'))
    }
    this.pending = []
    if (!d) return
    d.removeEventListener('inputreport', this.onInputBound)
    try {
      if (d.opened) await d.close()
    } catch {
      /* ignore */
    }
  }

  private onInput(ev: HIDInputReportEvent) {
    if (ev.reportId !== REPORT_LONG) return
    const data = new Uint8Array(ev.data.buffer)
    if (data.length < 3) return
    const deviceIndex = data[0]!
    const featureIndex = data[1]!
    const fnSw = data[2]!
    const swId = fnSw & 0x0f
    const params = data.slice(3)

    if (deviceIndex !== this.deviceIndex) return

    // HID++ 2.0 error
    if (featureIndex === 0xff) {
      const errFeat = params[0]
      const errFnSw = params[1]
      const errCode = params[2]
      const match = this.pending.find(
        (p) => p.swId === ((errFnSw ?? 0) & 0x0f),
      )
      if (match) {
        this.pending = this.pending.filter((p) => p !== match)
        clearTimeout(match.timer)
        match.reject(
          new Error(
            `HID++ error feat=0x${(errFeat ?? 0).toString(16)} code=${errCode}`,
          ),
        )
      }
      return
    }

    const matchIdx = this.pending.findIndex(
      (p) => p.featureIndex === featureIndex && p.swId === swId,
    )
    if (matchIdx < 0) return
    const match = this.pending[matchIdx]!
    this.pending.splice(matchIdx, 1)
    clearTimeout(match.timer)
    match.resolve(params)
  }

  private nextSwId(): number {
    this.swId = (this.swId + 1) & 0x0f
    if (this.swId === 0) this.swId = 1
    return this.swId
  }

  /**
   * Send long HID++ request; returns params after featureIndex/fnSw header.
   * Wire: reportId 0x11 | deviceIndex | featureIndex | (fn<<4)|swId | params… (pad to 20)
   * All calls are serialized - concurrent TX breaks wireless 8100 writes.
   */
  async request(
    featureIndex: number,
    functionId: number,
    params: Uint8Array = new Uint8Array(0),
    timeoutMs = 1200,
  ): Promise<Uint8Array> {
    const run = async (): Promise<Uint8Array> => {
      if (!this.device?.opened) throw new Error('HID++ device not open')
      const swId = this.nextSwId()
      const body = new Uint8Array(19)
      body[0] = this.deviceIndex
      body[1] = featureIndex & 0xff
      body[2] = ((functionId & 0x0f) << 4) | (swId & 0x0f)
      body.set(params.subarray(0, 16), 3)

      const result = new Promise<Uint8Array>((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending = this.pending.filter((p) => p.timer !== timer)
          reject(
            new Error(`HID++ timeout featIdx=${featureIndex} fn=${functionId}`),
          )
        }, timeoutMs)
        this.pending.push({ featureIndex, swId, resolve, reject, timer })
      })

      await this.device.sendReport(REPORT_LONG, body)
      return result
    }

    const next = this.requestChain.then(run, run)
    this.requestChain = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  async getFeature(featureId: number): Promise<number | null> {
    const cached = this.featureMap.get(featureId)
    if (cached != null) return cached
    const params = new Uint8Array([
      (featureId >> 8) & 0xff,
      featureId & 0xff,
    ])
    const resp = await this.request(0, 0, params)
    const idx = resp[0] ?? 0
    if (idx === 0 && featureId !== HIDPP.ROOT) {
      return null
    }
    this.featureMap.set(featureId, idx)
    return idx
  }

  async call(
    featureId: number,
    functionId: number,
    params: Uint8Array = new Uint8Array(0),
    timeoutMs?: number,
  ): Promise<Uint8Array> {
    const idx = await this.getFeature(featureId)
    if (idx == null) {
      throw new Error(`Feature 0x${featureId.toString(16)} not present`)
    }
    return this.request(idx, functionId, params, timeoutMs ?? 1200)
  }

  async ping(): Promise<{ major: number; minor: number }> {
    const r = await this.request(0, 1, new Uint8Array([0x00, 0x00, 0x88]))
    return { major: r[0] ?? 0, minor: r[1] ?? 0 }
  }

  async getDeviceName(): Promise<string> {
    const idx = await this.getFeature(HIDPP.DEVICE_NAME)
    if (idx == null) return ''
    const countResp = await this.request(idx, 0)
    const len = countResp[0] ?? 0
    const chars: number[] = []
    // fn1 getDeviceName(charIndex) - first response returns from index 0 a chunk
    const chunk = await this.request(idx, 1, new Uint8Array([0]))
    for (let i = 0; i < chunk.length && chars.length < len; i++) {
      const c = chunk[i]!
      if (c === 0) break
      chars.push(c)
    }
    return String.fromCharCode(...chars)
  }

  async getFwTag(): Promise<string> {
    try {
      const r = await this.call(HIDPP.DEVICE_INFO, 1)
      // entity 0 style: type + 3-char fw name + …
      const name = String.fromCharCode(r[1] ?? 0, r[2] ?? 0, r[3] ?? 0, r[4] ?? 0)
      return name.replace(/\0/g, '').trim() || '-'
    } catch {
      return '-'
    }
  }

  async getBattery(): Promise<HidppBattery> {
    // OMM Battery.cs + Solaar: Feature1004
    //   fn0 GetCapabilities  (flags / levels - NOT percent)
    //   fn1 GetStatus        → state_of_charge, charging_status, …
    // Live Superlight v1: fn1 = 0x53 → 83% (matches OMM UI).
    const r = await this.call(HIDPP.BATTERY_UNIFIED, 1)
    const percent = r[0] ?? null
    const levelFlags = r[1] ?? null
    const status = r[2] ?? 0
    // charging_status != 0 → charging (OMM OnF1004Broadcast)
    const charging = status !== 0
    return {
      percent: percent != null && percent > 0 ? percent : null,
      nextLevel: levelFlags,
      status,
      charging,
    }
  }

  async getDpi(sensor = 0): Promise<HidppDpiInfo> {
    const cur = await this.call(
      HIDPP.ADJUSTABLE_DPI,
      2,
      new Uint8Array([sensor & 0xff]),
    )
    const dpi = ((cur[1] ?? 0) << 8) | (cur[2] ?? 0)
    const defaultDpi = ((cur[3] ?? 0) << 8) | (cur[4] ?? 0)

    let listMin = 100
    let listMax = 25600
    let listStep = 50
    try {
      const list = await this.call(
        HIDPP.ADJUSTABLE_DPI,
        1,
        new Uint8Array([sensor & 0xff]),
      )
      // sensorIdx + values: min, 0xE000|step, max  (Superlight live)
      const v0 = ((list[1] ?? 0) << 8) | (list[2] ?? 0)
      const v1 = ((list[3] ?? 0) << 8) | (list[4] ?? 0)
      const v2 = ((list[5] ?? 0) << 8) | (list[6] ?? 0)
      if (v0 > 0 && v0 < 0xe000) listMin = v0
      if ((v1 & 0xe000) === 0xe000) listStep = v1 & 0x1fff
      if (v2 > 0 && v2 < 0xe000) listMax = v2
    } catch {
      /* keep defaults */
    }

    return { dpi, defaultDpi: defaultDpi || dpi, listMin, listMax, listStep }
  }

  async setDpi(dpi: number, sensor = 0): Promise<void> {
    // Caller (driver) already clamps via live 2201 list; keep a safe fallback here.
    const clamped = Math.max(100, Math.min(25600, Math.round(dpi / 50) * 50))
    await this.call(
      HIDPP.ADJUSTABLE_DPI,
      3,
      new Uint8Array([
        sensor & 0xff,
        (clamped >> 8) & 0xff,
        clamped & 0xff,
      ]),
    )
  }

  /**
   * Read active onboard profile via Feature8100.
   * OMM DPITable: slot combo = consecutive Enabled count; Enabled iff resolution ≠ 0.
   * Solaar OnboardProfile.from_bytes: rate, idxs, 5× LE u16 @3; buttons @32 (4 B each).
   *
   * fn2 = GetOnboardMode (1=onboard, 2=host) - NOT sector.
   * fn4 = GetActiveProfile (u16 BE; ROM ids use low byte as flash sector).
   */
  async getOnboardDpiTable(): Promise<OnboardDpiTable | null> {
    const feat = await this.getFeature(HIDPP.ONBOARD_PROFILES)
    if (feat == null) return null

    let buttonCount = 5
    let sectorSize = 255
    let profileCount = 5
    try {
      const info = await this.call(HIDPP.ONBOARD_PROFILES, 0)
      const bc = info[5] ?? 5
      if (bc > 0 && bc <= 16) buttonCount = bc
      const pc = info[3] ?? 5
      if (pc > 0 && pc <= 16) profileCount = pc
      const sz = ((info[7] ?? 0) << 8) | (info[8] ?? 0)
      if (sz >= 64 && sz <= 512) sectorSize = sz
    } catch {
      /* keep defaults */
    }

    const profileId = await this.getActiveOnboardProfileId()
    const bytes = await this.readOnboardSector(profileId, sectorSize)
    if (!bytes) return null

    // Flash slot may be corrupt after a failed write - don't poison UI with 0xFFFF trash.
    if (!isValidOnboardProfileBytes(bytes)) {
      umdLog('superlight', 'warn', '8100 active profile bytes invalid', {
        profileId: profileId.toString(16),
      })
      // Prefer ROM 0x0101 when flash mirror is trash and we're "on" profile 1.
      if ((profileId & 0xff) === 1 && profileId !== 0x0101) {
        const rom = await this.readOnboardSector(0x0101, sectorSize)
        if (rom && isValidOnboardProfileBytes(rom)) {
          return this.decodeOnboardDpiTable(
            rom,
            0x0101,
            buttonCount,
            profileCount,
          )
        }
      }
      return null
    }

    return this.decodeOnboardDpiTable(
      bytes,
      profileId,
      buttonCount,
      profileCount,
    )
  }

  private decodeOnboardDpiTable(
    bytes: Uint8Array,
    profileId: number,
    buttonCount: number,
    profileCount: number,
  ): OnboardDpiTable {
    const reportRateMs = bytes[0] ?? 1
    const defaultIndex = bytes[1] ?? 0
    const shiftIndex = bytes[2] ?? 0
    const resolutions: number[] = []
    for (let i = 0; i < 5; i++) {
      const off = 3 + i * 2
      resolutions.push(bytes[off]! | (bytes[off + 1]! << 8))
    }

    let enabledCount = 0
    for (const v of resolutions) {
      if (v === 0) break
      enabledCount++
    }
    if (enabledCount === 0) enabledCount = 1

    const buttonMacros: Uint8Array[] = []
    for (let i = 0; i < buttonCount; i++) {
      const off = 32 + i * 4
      buttonMacros.push(bytes.slice(off, off + 4))
    }

    const uiSector = profileId & 0xff

    return {
      sector: uiSector >= 1 ? uiSector : 1,
      reportRateMs,
      defaultIndex: Math.min(Math.max(0, defaultIndex), 4),
      shiftIndex: Math.min(Math.max(0, shiftIndex), 4),
      resolutions,
      enabledCount,
      activeIndex: Math.min(Math.max(0, defaultIndex), 4),
      buttonCount,
      buttonMacros,
      profileCount,
    }
  }

  /**
   * Live active DPI slot on current profile (libratbag: CMD 0xB0 → fn 11).
   * OMM SetCurrentDPI / GetActiveProfileResolution.
   */
  async getActiveDpiIndex(): Promise<number | null> {
    try {
      const r = await this.call(HIDPP.ONBOARD_PROFILES, 11)
      const idx = r[0] ?? 0
      if (idx > 4) return null
      return idx
    } catch {
      return null
    }
  }

  /** Set live active DPI slot (libratbag: CMD 0xC0 → fn 12). Index 0..4. */
  async setActiveDpiIndex(index: number): Promise<void> {
    const i = Math.min(4, Math.max(0, Math.floor(index)))
    await this.call(HIDPP.ONBOARD_PROFILES, 12, new Uint8Array([i]))
  }

  /** Full profile id from fn4 (flash 0x000N or ROM 0x01NN). */
  async getActiveOnboardProfileId(): Promise<number> {
    try {
      const active = await this.call(HIDPP.ONBOARD_PROFILES, 4)
      const raw = ((active[0] ?? 0) << 8) | (active[1] ?? 0)
      if (raw > 0) return raw
    } catch {
      /* fall through */
    }
    return 0x0101
  }

  /**
   * UI / flash slot number 1..N.
   * ROM ids (0x01NN) map to NN so the selector stays 1-based flash slots.
   */
  async getActiveOnboardSector(): Promise<number> {
    const id = await this.getActiveOnboardProfileId()
    const s = id & 0xff
    return s >= 1 ? s : 1
  }

  async getOnboardProfilesInfo(): Promise<OnboardProfileInfo | null> {
    const feat = await this.getFeature(HIDPP.ONBOARD_PROFILES)
    if (feat == null) return null
    const info = await this.call(HIDPP.ONBOARD_PROFILES, 0)
    let profileCount = info[3] ?? 5
    if (profileCount < 1 || profileCount > 16) profileCount = 5
    let buttonCount = info[5] ?? 5
    if (buttonCount < 1 || buttonCount > 16) buttonCount = 5
    let sectorSize = ((info[7] ?? 0) << 8) | (info[8] ?? 0)
    if (sectorSize < 64 || sectorSize > 512) sectorSize = 255

    // Do not rewrite directory on every sync - that blocks first paint.
    // ensureOnboardProfileDirectory runs on profile switch if needed.
    const sectors = await this.readOnboardProfileDirectory(sectorSize)
    const activeSector = await this.getActiveOnboardSector()
    return {
      profileCount,
      sectorSize,
      buttonCount,
      sectors:
        sectors.length > 0
          ? sectors
          : Array.from({ length: profileCount }, (_, i) => i + 1),
      activeSector,
    }
  }

  /**
   * Directory @ sector 0: entries of (sector u16 BE, enabled u8, 0x00), end FF FF 00 00.
   * Live Superlight often ships without a flash directory (only ROM 0x0101) - then only
   * profile 1 activates; we write a full 1..N directory once.
   */
  async readOnboardProfileDirectory(sectorSize = 255): Promise<number[]> {
    const bytes = await this.readOnboardSector(0, sectorSize)
    if (!bytes) return [1]
    // Heuristic: real directory starts with 00 01 …; profile payload starts with rate 01..08
    if (bytes[0] !== 0 || bytes[1] < 1 || bytes[1] > 16) {
      return [1]
    }
    const sectors: number[] = []
    for (let i = 0; i + 3 < sectorSize - 2; i += 4) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xff) break
      const sector = ((bytes[i]! << 8) | bytes[i + 1]!) & 0xff
      const enabled = bytes[i + 2]!
      if (sector >= 1 && enabled) sectors.push(sector)
    }
    return sectors.length ? sectors : [1]
  }

  async ensureOnboardProfileDirectory(
    profileCount: number,
    sectorSize = 255,
    force = false,
  ): Promise<void> {
    const n = Math.min(16, Math.max(1, profileCount))
    if (!force) {
      const existing = await this.readOnboardProfileDirectory(sectorSize)
      const need = Array.from({ length: n }, (_, i) => i + 1)
      const ok =
        existing.length >= n && need.every((s, i) => existing[i] === s)
      if (ok) return
    }

    const dir = new Uint8Array(sectorSize)
    dir.fill(0xff)
    let off = 0
    for (let s = 1; s <= n; s++) {
      dir[off] = 0
      dir[off + 1] = s & 0xff
      dir[off + 2] = 1
      dir[off + 3] = 0
      off += 4
    }
    dir[off] = 0xff
    dir[off + 1] = 0xff
    dir[off + 2] = 0
    dir[off + 3] = 0
    const crc = crc16Ccitt(dir.subarray(0, sectorSize - 2))
    dir[sectorSize - 2] = (crc >> 8) & 0xff
    dir[sectorSize - 1] = crc & 0xff
    umdLog('superlight', 'info', '8100 write profile directory', {
      profiles: n,
      force,
      crc: crc.toString(16),
    })
    await this.writeOnboardSector(0, dir)
    await sleep(100)
  }

  /**
   * Flash profile must be valid before SetActiveProfile(00 0N) - corrupt sector →
   * HID++ invalid_argument and device stays on ROM 0x0101.
   */
  async ensureFlashProfileSector(
    sector: number,
    sectorSize = 255,
  ): Promise<void> {
    const s = Math.max(1, Math.min(5, Math.floor(sector)))
    const bytes = await this.readOnboardSector(s, sectorSize)
    if (bytes && isValidOnboardProfileBytes(bytes)) return

    umdLog('superlight', 'warn', '8100 heal corrupt flash profile', {
      sector: s,
    })
    const factory = getSuperlightFactorySector(s)
    if (factory.length !== sectorSize) {
      // Resize / re-CRC if sizes ever diverge
      const buf = new Uint8Array(sectorSize)
      buf.fill(0xff)
      buf.set(factory.subarray(0, Math.min(factory.length, sectorSize)))
      const crc = crc16Ccitt(buf.subarray(0, sectorSize - 2))
      buf[sectorSize - 2] = (crc >> 8) & 0xff
      buf[sectorSize - 1] = crc & 0xff
      await this.writeOnboardSector(s, buf)
    } else {
      await this.writeOnboardSector(s, factory)
    }
    await sleep(60)
  }

  /** Activate onboard profile sector (fn3). Params = u16 BE sector (00 0N). */
  async setActiveOnboardProfile(sector: number): Promise<void> {
    const s = Math.max(1, Math.min(16, Math.floor(sector)))
    const info = await this.call(HIDPP.ONBOARD_PROFILES, 0).catch(() => null)
    let profileCount = 5
    let sectorSize = 255
    if (info) {
      const pc = info[3] ?? 5
      if (pc > 0 && pc <= 16) profileCount = pc
      const sz = ((info[7] ?? 0) << 8) | (info[8] ?? 0)
      if (sz >= 64 && sz <= 512) sectorSize = sz
    }

    await this.ensureOnboardProfileDirectory(profileCount, sectorSize)
    await this.ensureFlashProfileSector(s, sectorSize)

    const mode = await this.call(HIDPP.ONBOARD_PROFILES, 2).catch(() => null)
    if ((mode?.[0] ?? 0) !== 1) {
      await this.call(HIDPP.ONBOARD_PROFILES, 1, new Uint8Array([1]))
    }

    const already = await this.getActiveOnboardProfileId()
    if (already === s) {
      umdLog('superlight', 'info', '8100 already on flash profile', { sector: s })
      return
    }

    umdLog('superlight', 'info', '8100 set active profile', { sector: s })
    await this.setActiveProfileRaw(s)

    let gotId = await this.getActiveOnboardProfileId()
    if (gotId !== s) {
      umdLog('superlight', 'warn', '8100 active mismatch, heal+retry', {
        want: s,
        gotId: gotId.toString(16),
      })
      await this.ensureFlashProfileSector(s, sectorSize)
      await this.setActiveProfileRaw(s)
      await sleep(100)
      gotId = await this.getActiveOnboardProfileId()
    }
    if (gotId !== s) {
      throw new Error(
        `SetActiveProfile: device stayed on 0x${gotId.toString(16)}, wanted flash ${s}`,
      )
    }
  }

  /**
   * fn3 SetActiveProfile. On WebHID timeout, trust fn4 if it already shows the target
   * (LIGHTSPEED often applies the switch but drops the ack under load).
   */
  private async setActiveProfileRaw(sector: number): Promise<void> {
    const params = new Uint8Array([(sector >> 8) & 0xff, sector & 0xff])
    try {
      await this.call(HIDPP.ONBOARD_PROFILES, 3, params, 2500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('timeout')) throw err instanceof Error ? err : new Error(msg)
      await sleep(100)
      const got = await this.getActiveOnboardProfileId()
      if (got === sector) {
        umdLog('superlight', 'warn', '8100 fn3 timeout but fn4 matches', {
          sector,
        })
        return
      }
      throw err instanceof Error ? err : new Error(msg)
    }
  }

  /** Read one onboard flash/ROM sector (Solaar read_sector / 8100 fn5). */
  async readOnboardSector(
    sector: number,
    size = 255,
  ): Promise<Uint8Array | null> {
    const feat = await this.getFeature(HIDPP.ONBOARD_PROFILES)
    if (feat == null) return null
    const buf = new Uint8Array(size)
    let o = 0
    while (o < size - 15) {
      const chunk = await this.call(
        HIDPP.ONBOARD_PROFILES,
        5,
        new Uint8Array([
          (sector >> 8) & 0xff,
          sector & 0xff,
          (o >> 8) & 0xff,
          o & 0xff,
        ]),
      )
      buf.set(chunk.subarray(0, 16), o)
      o += 16
    }
    const last = size - 16
    const chunk = await this.call(
      HIDPP.ONBOARD_PROFILES,
      5,
      new Uint8Array([
        (sector >> 8) & 0xff,
        sector & 0xff,
        (last >> 8) & 0xff,
        last & 0xff,
      ]),
    )
    // last awkward slice - same as Solaar
    const need = size - o
    buf.set(chunk.subarray(16 - need, 16), o)
    return buf
  }

  /**
   * Write full sector (fn6 start / fn7 data×16 / fn8 end). CRC must already be set.
   * Live Superlight: while onboard mode is active, 8060 set is rejected - profile write
   * is how OMM persists report rate + DPI table.
   */
  async writeOnboardSector(sector: number, data: Uint8Array): Promise<void> {
    const size = data.length
    // Solaar: skip rewrite when payload (sans CRC) is unchanged.
    const existing = await this.readOnboardSector(sector, size).catch(() => null)
    if (existing && existing.length === size) {
      let same = true
      for (let i = 0; i < size - 2; i++) {
        if (existing[i] !== data[i]) {
          same = false
          break
        }
      }
      if (same) {
        umdLog('superlight', 'info', '8100 sector unchanged, skip write', {
          sector,
        })
        return
      }
    }

    let lastErr: unknown
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await this.programOnboardSector(sector, data)
        return
      } catch (err) {
        lastErr = err
        umdLog('superlight', 'warn', '8100 sector write retry', {
          sector,
          attempt,
          err: err instanceof Error ? err.message : String(err),
        })
        await this.abortOnboardWrite()
        await sleep(120)
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error(String(lastErr ?? '8100 sector write failed'))
  }

  private async abortOnboardWrite(): Promise<void> {
    try {
      await this.call(HIDPP.ONBOARD_PROFILES, 8, new Uint8Array(0), 2000)
    } catch {
      /* ignore - may already be idle */
    }
  }

  private async programOnboardSector(
    sector: number,
    data: Uint8Array,
  ): Promise<void> {
    const size = data.length
    const writeTimeout = 3500
    await this.call(
      HIDPP.ONBOARD_PROFILES,
      6,
      new Uint8Array([
        (sector >> 8) & 0xff,
        sector & 0xff,
        0,
        0,
        (size >> 8) & 0xff,
        size & 0xff,
      ]),
      writeTimeout,
    )
    let o = 0
    while (o < size - 1) {
      const slice = new Uint8Array(16)
      slice.set(data.subarray(o, Math.min(o + 16, size)))
      await this.call(HIDPP.ONBOARD_PROFILES, 7, slice, writeTimeout)
      o += 16
      // LIGHTSPEED + WebHID: gap avoids dropped fn7/fn8 replies under load.
      await sleep(12)
    }
    await this.call(HIDPP.ONBOARD_PROFILES, 8, new Uint8Array(0), writeTimeout)
    await sleep(80)
  }

  /**
   * Patch active profile DPI table / report rate / default index, recompute CRC, flash.
   * Disabled slots must be written as 0 (OMM `Enabled = value != 0`).
   */
  async writeOnboardDpiAndRate(opts: {
    resolutions: number[]
    reportRateMs?: number
    defaultIndex?: number
    shiftIndex?: number
    /** 5× 4-byte macros @ offset 32; L/R always forced to factory. */
    buttonMacros?: Uint8Array[]
    /** When set, patch this sector (UI profile) instead of whatever is active. */
    sector?: number
  }): Promise<void> {
    const sector =
      opts.sector != null && opts.sector >= 1
        ? Math.floor(opts.sector)
        : await this.getActiveOnboardSector()
    const info = await this.call(HIDPP.ONBOARD_PROFILES, 0).catch(() => null)
    let size = 255
    if (info) {
      const sz = ((info[7] ?? 0) << 8) | (info[8] ?? 0)
      if (sz >= 64 && sz <= 512) size = sz
    }
    // Never RMW a corrupted flash slot (that produced 0xFFFF DPI trash).
    await this.ensureFlashProfileSector(sector, size)
    const bytes = await this.readOnboardSector(sector, size)
    if (!bytes) throw new Error('Nie można odczytać sektora profilu')
    if (!isValidOnboardProfileBytes(bytes)) {
      throw new Error(`Sektor profilu ${sector} nadal uszkodzony po heal`)
    }

    if (opts.reportRateMs != null && opts.reportRateMs > 0) {
      bytes[0] = opts.reportRateMs & 0xff
    }
    if (opts.defaultIndex != null) {
      bytes[1] = Math.min(4, Math.max(0, opts.defaultIndex)) & 0xff
    }
    if (opts.shiftIndex != null) {
      bytes[2] = Math.min(4, Math.max(0, opts.shiftIndex)) & 0xff
    }
    for (let i = 0; i < 5; i++) {
      const v = Math.max(0, Math.round(opts.resolutions[i] ?? 0)) & 0xffff
      const off = 3 + i * 2
      bytes[off] = v & 0xff
      bytes[off + 1] = (v >> 8) & 0xff
    }
    // OMM never remaps Left/Right - keep factory macros even if sector was corrupted.
    const left = new Uint8Array([0x80, 0x01, 0x00, 0x01])
    const right = new Uint8Array([0x80, 0x01, 0x00, 0x02])
    for (let i = 0; i < 5; i++) {
      const off = 32 + i * 4
      let macro: Uint8Array
      if (i === 0) macro = left
      else if (i === 1) macro = right
      else if (opts.buttonMacros?.[i] && opts.buttonMacros[i]!.length >= 4) {
        macro = opts.buttonMacros[i]!
      } else {
        continue // leave existing flash bytes for M/Back/Forward
      }
      bytes[off] = macro[0]!
      bytes[off + 1] = macro[1]!
      bytes[off + 2] = macro[2]!
      bytes[off + 3] = macro[3]!
    }
    const crc = crc16Ccitt(bytes.subarray(0, size - 2))
    bytes[size - 2] = (crc >> 8) & 0xff
    bytes[size - 1] = crc & 0xff

    umdLog('superlight', 'info', '8100 write profile', {
      sector,
      rateMs: bytes[0],
      defaultIndex: bytes[1],
      shiftIndex: bytes[2],
      resolutions: opts.resolutions.slice(0, 5),
      buttons: Array.from({ length: 5 }, (_, i) =>
        Array.from(bytes.subarray(32 + i * 4, 32 + i * 4 + 4))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      ),
      crc: crc.toString(16),
    })
    await this.writeOnboardSector(sector, bytes)
  }

  /**
   * 0x8060 - live Superlight: fn0 = supported bitmask (ms bits),
   * fn1 = current rate in ms (1 → 1000 Hz).
   */
  async getReportRateHz(): Promise<{ hz: number; supportedHz: number[] }> {
    const list = await this.call(HIDPP.REPORT_RATE, 0)
    const mask = list[0] ?? 0
    const msBits = [1, 2, 4, 8] // bit0..bit3
    const supportedHz: number[] = []
    for (let bit = 0; bit < 4; bit++) {
      if (mask & (1 << bit)) {
        const ms = msBits[bit]!
        supportedHz.push(Math.round(1000 / ms))
      }
    }
    // bit7 seen on device (0x8B) - ignore unknown extras

    let hz = 1000
    try {
      const cur = await this.call(HIDPP.REPORT_RATE, 1)
      const ms = cur[0] ?? 1
      if (ms > 0) hz = Math.round(1000 / ms)
    } catch {
      /* keep */
    }

    if (!supportedHz.length) supportedHz.push(125, 250, 500, 1000)
    return { hz, supportedHz: [...new Set(supportedHz)].sort((a, b) => a - b) }
  }

  async setReportRateHz(hz: number): Promise<void> {
    const ms = Math.max(1, Math.min(8, Math.round(1000 / hz)))
    // Onboard mode rejects 8060 fn2 (live: HID++ error). Persist via profile like OMM.
    // Caller should pass current UI resolutions via writeOnboardDpiAndRate when possible.
    const cur = await this.getOnboardDpiTable()
    if (!cur) throw new Error('Brak profilu onboard do zapisu Hz')
    await this.writeOnboardDpiAndRate({
      resolutions: cur.resolutions,
      reportRateMs: ms,
      defaultIndex: cur.defaultIndex,
    })
  }

  /** Persist Hz using explicit DPI table (avoids clobbering pending UI slot edits). */
  async setReportRateHzWithTable(
    hz: number,
    resolutions: number[],
    defaultIndex: number,
    sector?: number,
    shiftIndex?: number,
  ): Promise<void> {
    const ms = Math.max(1, Math.min(8, Math.round(1000 / hz)))
    await this.writeOnboardDpiAndRate({
      resolutions,
      reportRateMs: ms,
      defaultIndex,
      shiftIndex,
      sector,
    })
  }
}
