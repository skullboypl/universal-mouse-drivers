import {
  DongleCommand,
  INDEX_TO_POLLING_RATE,
  OLD_CODE_TO_POLLING_RATE,
  OLD_POLLING_RATE_TO_CODE,
  POLLING_RATE_TO_INDEX,
} from './constants';
import { dongleReportCrc } from './crc';
import type { MouseDeviceProfile } from '../profile';

const FEATURE_REPORT_ID = 0;
const OUTPUT_REPORT_ID = 8;
const READFILE_REPORT_ID = 4;
const REPORT_SIZE = 64;
const HID_ACK = 0xa1;

export interface BatteryLevel {
  percent: number;
  status: number;
  charging: boolean;
  source: 'feature' | 'feature-old' | 'output';
  raw: number[];
}

export interface DpiStageInfo {
  stageCount: number;
  x: number[];
  y: number[];
}

export interface DebounceInfo {
  beforePressMs: number;
  beforeReleaseMs: number;
  afterPressMs: number;
  afterReleaseMs: number;
  diyEnabled: boolean;
}

export interface MouseFullState {
  productName: string;
  pid: number;
  profileName: string;
  isWired: boolean;
  isNewProtocol: boolean;
  firmware: string;
  pollingHz: number;
  battery: BatteryLevel | null;
  activeDpiStage: number;
  dpiMax: number;
  dpiStages: DpiStageInfo | null;
  dpiAxisSync: boolean;
  dpiColors: string[];
  lod: number;
  sleepSeconds: number;
  sensorAngle: number;
  motionSync: boolean;
  rippleControl: boolean;
  angleSnap: boolean;
  profileId: number;
  ledEnabled: boolean;
  ledEffect: number;
  debounce: DebounceInfo | null;
  wheelDebounce: { rate: number; ms: number } | null;
}

export interface ConnectOptions {
  /** Pokaż picker HID gdy brak zapamiętanego urządzenia (domyślnie: true). */
  interactive?: boolean;
  /** Preferowany PID przy wielu autoryzowanych interfejsach. */
  preferPid?: number;
}

export class GWolvesDriver {
  /** Interfejs z feature report 64B - wysyłanie/odbiór komend (setReportDevice). */
  private setReportDevice: HIDDevice | null = null;
  /** Interfejs z input report 4 - async odpowiedzi (readFileDevice). */
  private readFileDevice: HIDDevice | null = null;
  /** Interfejs z output report 8 - dongle. */
  private outputDevice: HIDDevice | null = null;
  private profile: MouseDeviceProfile;
  private connectedPid = 0;
  private isWired = true;
  private receivedOutput: Uint8Array | null = null;
  private outputListener: ((e: HIDInputReportEvent) => void) | null = null;
  private outputLock: Promise<void> = Promise.resolve();
  private featureReportId = FEATURE_REPORT_ID;
  private featurePayloadSize = REPORT_SIZE;
  /** OEM hidIndex: 1 when response[0] >= 0xA0 (ACK without report-id prefix). */
  private hidIndex = 1;

  constructor(profile?: MouseDeviceProfile) {
    this.profile = profile ?? {
      name: 'Auto',
      vid: 0x33e4,
      pidWired: 0,
      pidWireless: 0,
      pidWireless4k8k: 0,
      isNewProtocol: false,
      wiredDeviceId: 2,
      dpiMax: 30000,
      dpiStep: 50,
      dpiMaxStages: 7,
      pollingRatesWired: [125, 250, 500, 1000, 2000, 4000, 8000],
      pollingRatesWireless: [125, 250, 500, 1000],
      commonDelayMs: 20,
      competitiveEnable: false,
      dpiXyEnable: true,
    };
  }

  get activeProfile(): MouseDeviceProfile {
    return this.profile;
  }

  get connected(): boolean {
    return this.setReportDevice?.opened ?? false;
  }

  get connectedDevice(): HIDDevice | null {
    return this.setReportDevice;
  }

  async listAuthorizedDevices(): Promise<HIDDevice[]> {
    if (!('hid' in navigator) || !navigator.hid) return [];
    const vid = this.profile.vid || 0x33e4;
    const devices = await navigator.hid.getDevices();
    return devices.filter((d) => d.vendorId === vid);
  }

  /** Łączy bez pickera - tylko wcześniej autoryzowane urządzenia WebHID. */
  async connectAuthorized(preferPid?: number): Promise<HIDDevice | null> {
    const authorized = await this.listAuthorizedDevices();
    if (!authorized.length) return null;

    const candidates = preferPid
      ? authorized.filter((d) => d.productId === preferPid)
      : authorized;
    if (!candidates.length) return null;

    // Tray C#: need feature report length ≥ 65 (id+64). Skip mouse-only interfaces.
    const hasFeature64 = candidates.some((d) => this.bestFeatureInfo(d).size >= 64);
    if (!hasFeature64) return null;

    return this.bindDevices(candidates);
  }

  async connect(
    explicitProfile?: MouseDeviceProfile,
    options: ConnectOptions = {}
  ): Promise<HIDDevice> {
    if (!('hid' in navigator) || !navigator.hid) {
      throw new Error('WebHID niedostępny - użyj Chrome/Edge na umdrivers.com.');
    }

    if (explicitProfile) this.profile = explicitProfile;

    const interactive = options.interactive ?? true;
    const authorized = await this.connectAuthorized(options.preferPid);
    if (authorized) return authorized;

    if (!interactive) {
      throw new Error('Brak zapamiętanego urządzenia - kliknij Połącz i wybierz mysz w oknie HID.');
    }

    const vid = this.profile.vid || 0x33e4;
    const devices = await navigator.hid!.requestDevice({
      filters: [
        { vendorId: vid, productId: this.profile.pidWired },
        { vendorId: vid, productId: this.profile.pidWireless },
        { vendorId: vid, productId: this.profile.pidWireless4k8k },
        { vendorId: vid },
      ].filter((f) => f.productId == null || f.productId > 0),
    });
    if (!devices.length) throw new Error('Nie wybrano urządzenia');

    // Merge freshly picked + any other authorized interfaces for same PID
    const preferPid = options.preferPid ?? devices[0]?.productId;
    const merged = new Map<string, HIDDevice>();
    for (const d of devices) merged.set(`${d.vendorId}:${d.productId}:${d.productName}:${d.collections?.length}`, d);
    for (const d of await this.listAuthorizedDevices()) {
      if (preferPid != null && d.productId !== preferPid) continue;
      merged.set(`${d.vendorId}:${d.productId}:${d.productName}:${d.collections?.length}`, d);
    }

    const pool = [...merged.values()];
    if (!pool.some((d) => this.bestFeatureInfo(d).size >= 64)) {
      throw new Error(
        'Wybrano zły interfejs HID. W oknie Chrome zaznacz interfejs vendor/dongle (feature 64B), nie „HID-compliant mouse”.',
      );
    }

    return this.bindDevices(pool);
  }

  /** Bind an explicit device list (all interfaces for the dongle). */
  async bindDeviceList(devices: HIDDevice[]): Promise<HIDDevice> {
    return this.bindDevices(devices);
  }

  /** Debug snapshot of which interfaces were bound. */
  getInterfaceDebug(): {
    setReport: string | null
    featureReportId: number
    featurePayloadSize: number
    hasOutput8: boolean
  } {
    return {
      setReport: this.setReportDevice?.productName ?? null,
      featureReportId: this.featureReportId,
      featurePayloadSize: this.featurePayloadSize,
      hasOutput8: this.hasOutputReport8(),
    };
  }

  private async bindDevices(devices: HIDDevice[]): Promise<HIDDevice> {
    const setReport = this.pickSetReportDevice(devices);
    const readFile = this.pickReadFileDevice(devices);
    const output = this.pickOutputDevice(devices);
    const feat = this.bestFeatureInfo(setReport);
    this.featureReportId = feat.id;
    this.featurePayloadSize = feat.size >= 64 ? feat.size : Math.max(feat.size, REPORT_SIZE);

    this.setReportDevice = setReport;
    this.readFileDevice = readFile;
    this.outputDevice = output ?? readFile ?? setReport;

    const toOpen = new Set<HIDDevice>([setReport]);
    if (readFile) toOpen.add(readFile);
    if (output && output !== setReport && output !== readFile) toOpen.add(output);

    for (const d of toOpen) {
      if (!d.opened) await d.open();
    }

    this.connectedPid = setReport.productId;
    this.isWired = this.profile.pidWired === setReport.productId;

    await this.attachOutputListener();
    await this.sleep(this.profile.commonDelayMs);
    return setReport;
  }

  async disconnect(): Promise<void> {
    this.detachOutputListener();
    const toClose = new Set<HIDDevice>();
    if (this.setReportDevice) toClose.add(this.setReportDevice);
    if (this.readFileDevice) toClose.add(this.readFileDevice);
    if (this.outputDevice) toClose.add(this.outputDevice);

    for (const d of toClose) {
      if (d.opened) await d.close();
    }

    this.setReportDevice = null;
    this.readFileDevice = null;
    this.outputDevice = null;
  }

  applyProfile(profile: MouseDeviceProfile): void {
    this.profile = profile;
    if (this.connectedPid) {
      this.isWired = profile.pidWired === this.connectedPid;
    }
  }

  async getFullState(): Promise<MouseFullState> {
    this.assertDevice();
    // OEM profileSelectValue defaults to 1 — NOT WiredDeviceID (2).
    // WiredDeviceID only rewrites feature frame byte[2].
    const profileSlot = 1;

    const soft = async <T>(fn: () => Promise<T>, fallback: T, label?: string): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (label) {
          console.warn(`[fenrir] soft fail ${label}:`, err instanceof Error ? err.message : err);
        }
        return fallback;
      }
    };

    const battery = await this.getBatteryLevel();

    // Serialize HID transactions — concurrent feature reports collide on one interface.
    const firmware = await soft(() => this.getFirmwareVersion(), '-', 'firmware');
    const pollingHz = await soft(() => this.getPollingRateHz(), 0, 'polling');
    const activeDpiStage = await soft(
      () => this.getActiveDpiStage(profileSlot),
      0,
      'activeDpi',
    );
    const dpiMax = await soft(() => this.getDpiMax(), this.profile.dpiMax, 'dpiMax');
    const dpiStages = await soft(
      () => this.getDpiStageInfo(profileSlot, this.profile.dpiMaxStages),
      null,
      'dpiStages',
    );
    const dpiColors = await soft(
      () => this.getDpiStageColors(profileSlot, this.profile.dpiMaxStages),
      [] as string[],
      'dpiColors',
    );
    // OEM ships getDPIXYOnOff — keep the HID flag (UI also derives from X==Y on first load).
    const dpiAxisSyncFlag = await soft(
      () => this.getDpiAxisSync(profileSlot),
      null as boolean | null,
      'dpiAxis',
    );
    const lod = await soft(() => this.getLod(), null as number | null, 'lod');
    const sleepSeconds = await soft(() => this.getSleepTime(profileSlot), 60, 'sleep');
    const sensorAngle = await soft(() => this.getSensorAngle(profileSlot), 0, 'angle');
    const motionSync = await soft(() => this.getMotionSync(profileSlot), false, 'motionSync');
    const rippleControl = await soft(
      () => this.getRippleControl(profileSlot),
      false,
      'ripple',
    );
    const angleSnap = await soft(() => this.getAngleSnap(profileSlot), false, 'angleSnap');
    const profileId = await soft(() => this.getProfileId(), 0, 'profileId');
    const led = await soft(
      () => this.getLedState(),
      { enabled: false, effectId: 1 },
      'led',
    );
    const debounce = await soft(() => this.getDebounceInfo(profileSlot), null, 'debounce');
    const wheelDebounce = await soft(() => this.getWheelDebounce(), null, 'wheelDebounce');

    // Prefer HID flag; fall back to active-stage X==Y like OEM first-load heuristic.
    const activeIdx = Math.max(0, (activeDpiStage || 1) - 1);
    const xyEqual =
      dpiStages != null
        ? (dpiStages.x[activeIdx] ?? 0) === (dpiStages.y[activeIdx] ?? dpiStages.x[activeIdx] ?? 0)
        : true;
    const dpiAxisSync = dpiAxisSyncFlag ?? xyEqual;

    return {
      productName: this.setReportDevice!.productName ?? 'Unknown',
      pid: this.connectedPid,
      profileName: this.profile.name,
      isWired: this.isWired,
      isNewProtocol: this.profile.isNewProtocol,
      firmware,
      pollingHz,
      battery,
      activeDpiStage,
      dpiMax,
      dpiStages,
      dpiAxisSync,
      dpiColors,
      lod: lod ?? 0,
      sleepSeconds,
      sensorAngle,
      motionSync,
      rippleControl,
      angleSnap,
      profileId,
      ledEnabled: led.enabled,
      ledEffect: led.effectId || 1,
      debounce,
      wheelDebounce,
    };
  }

  async getFirmwareVersion(): Promise<string> {
    // OEM getFirmwareVersion — feature [2]=2,[3]=16,[5]=129 (not dongle output)
    try {
      const req = new Uint8Array(REPORT_SIZE);
      req[2] = 2;
      req[3] = 16;
      req[5] = 129;
      await this.sendFeatureReport(req, false);
      await this.sleep(200);
      const res = this.cloneBuffer(await this.receiveFeatureReport());
      this.updateHidIndex(res);
      if (res[6] === 129) {
        this.hidIndex = 0;
        return `${res[7]}.${res[8]}.${res[9]}.${res[10]}`;
      }
      if (res[5] === 129) {
        this.hidIndex = 1;
        return `${res[6]}.${res[7]}.${res[8]}.${res[9]}`;
      }
    } catch {
      /* fall through */
    }

    if (!this.isWired) {
      const res = await this.transactOutput(outputCmd(DongleCommand.ReadVersionID), 50, 20);
      if (res) return `${res[5].toString(16)}.${res[6].toString(16)}`;
    }

    return '0.0.0.0';
  }

  async getPollingRateHz(_deviceId = 1): Promise<number> {
    if (!this.profile.isNewProtocol) {
      // OEM getPollRate — setReportOld cmd 130, code≠new-protocol index
      const req = legacyCmd(2, 130, 0);
      const res = await this.transactFeatureLegacy(req);
      const idx = this.legacyPayloadIndex();
      let code = res[idx];
      if (this.isWired && code === 64) code = 1; // OEM wired quirk
      const mapped = OLD_CODE_TO_POLLING_RATE[code];
      console.info('[fenrir] getPollRate raw', {
        hidIndex: this.hidIndex,
        idx,
        code,
        mapped,
        head: [...res.subarray(0, 12)],
      });
      if (!mapped) throw new Error(`Nieznany stary kod poll rate: ${code}`);
      return mapped;
    }

    const req = featureCmd(2, 2, 1, 128, _deviceId);
    const res = await this.transactFeature(req);
    const raw = res[this.featureDataIndex()];
    const mapped = raw === 16 ? 8000 : INDEX_TO_POLLING_RATE[raw] ?? raw;
    return mapped;
  }

  async setPollingRateHz(hz: number, deviceId = this.profile.wiredDeviceId): Promise<void> {
    if (!this.profile.isNewProtocol) {
      const code = OLD_POLLING_RATE_TO_CODE[hz];
      if (!code) throw new Error(`Nieobsługiwany polling rate (old): ${hz} Hz`);
      const req = legacyCmd(2, 2, 0, code);
      await this.transactFeatureLegacy(req);
      return;
    }

    const index = POLLING_RATE_TO_INDEX[hz];
    if (!index) throw new Error(`Nieobsługiwany polling rate: ${hz} Hz`);
    const req = featureCmd(2, 2, 1, 0, deviceId, index);
    await this.transactFeature(req);
  }

  async getActiveDpiStage(profileSlot = 1): Promise<number> {
    // OEM getActiveDPI(profileSelectValue) — 1-based stage at a[8-hidIndex]
    const req = featureCmd(2, 2, 1, 130, profileSlot);
    const res = await this.transactFeature(req);
    const stage = res[this.featureDataIndex()];
    console.info('[fenrir] getActiveDPI raw', {
      profileSlot,
      hidIndex: this.hidIndex,
      stage,
      head: [...res.subarray(0, 12)],
    });
    return stage;
  }

  async setActiveDpiStage(stage: number, profileSlot = 1): Promise<void> {
    // stage is 1-based (OEM)
    const req = featureCmd(2, 2, 1, 2, profileSlot, stage);
    await this.transactFeature(req);
  }

  async getDpiMax(): Promise<number> {
    const req = featureCmd(2, 2, 1, 140);
    const res = await this.transactFeature(req);
    const idx = this.featureDataIndex();
    return (res[idx - 1] << 8) | res[idx];
  }

  async getDpiStageInfo(profileSlot: number, maxStages: number): Promise<DpiStageInfo> {
    // OEM: getDPIStageInfo(profileSelectValue, DPIMaxStageNum)
    const req = featureCmd(2, 10, 1, 129, profileSlot, maxStages);
    const res = await this.transactFeature(req, 5, 100);
    const ackAt = 1 - this.hidIndex;
    const cmdAt = 6 - this.hidIndex;
    if (res[ackAt] !== HID_ACK || res[cmdAt] !== 129) {
      console.warn('[fenrir] getDPIStageInfo bad ack', {
        ackAt,
        cmdAt,
        head: [...res.subarray(0, 16)],
      });
      throw new Error('DPI stage info: brak ACK/cmd 129');
    }
    const count = res[this.featureDataIndex()];
    const x: number[] = [];
    const y: number[] = [];
    let offset = 0;
    for (let i = 0; i < count; i++) {
      const base = this.featureDataIndex() + 1 + offset;
      x.push((res[base] << 8) | res[base + 1]);
      y.push((res[base + 2] << 8) | res[base + 3]);
      offset += 4;
    }
    console.info('[fenrir] getDPIStageInfo', { profileSlot, maxStages, count, x, y });
    return { stageCount: count, x, y };
  }

  async getDpiAxisSync(deviceId = this.profile.wiredDeviceId): Promise<boolean> {
    const req = featureCmd(2, 2, 1, 141, this.profile.isNewProtocol ? deviceId : 0);
    const res = await this.transactFeature(req);
    return res[this.oldOrNewDataIndex()] === 1;
  }

  async getLod(_deviceId = 1): Promise<number> {
    if (!this.profile.isNewProtocol) {
      // OEM getLiftOff — setReportOld cmd 134 (0x86)
      const req = legacyCmd(1, 134, 0);
      const res = await this.transactFeatureLegacy(req);
      const raw = res[this.legacyPayloadIndex()];
      const decoded = raw > 2 ? raw / 10 : raw;
      console.info('[fenrir] getLiftOff raw', {
        hidIndex: this.hidIndex,
        raw,
        decoded,
        head: [...res.subarray(0, 12)],
      });
      return decoded;
    }

    const req = featureCmd(2, 2, 1, 136, _deviceId);
    const res = await this.transactFeature(req);
    const raw = res[this.featureDataIndex()];
    if (raw >= 128) return (raw & 0x7f) / 10;
    if (raw > 0 && raw < 10) return raw / 10;
    return raw;
  }

  async getSleepTime(deviceId = this.profile.wiredDeviceId): Promise<number> {
    const req = featureCmd(2, 3, 0, 135, this.profile.isNewProtocol ? deviceId : 0);
    const res = await this.transactFeature(req);
    if (this.profile.isNewProtocol) {
      const idx = this.featureDataIndex();
      return (res[idx] << 8) | res[idx + 1];
    }
    const idx = this.oldFeatureDataIndex();
    return (res[idx] << 8) | res[idx + 1];
  }

  /** OEM setSleepTime — BE u16 seconds. SET cmd [5]=7. */
  async setSleepTime(seconds: number, deviceId = this.profile.wiredDeviceId): Promise<void> {
    const sec = Math.max(0, Math.min(0xffff, Math.round(seconds)));
    const hi = (sec >> 8) & 0xff;
    const lo = sec & 0xff;
    if (this.profile.isNewProtocol) {
      const req = featureCmd(2, 3, 0, 7, deviceId, hi);
      req[8] = lo;
      await this.transactFeature(req);
      return;
    }
    // Old protocol: BE seconds at [6]/[7] (deviceId slot unused / 0)
    const req = featureCmd(2, 3, 0, 7, hi, lo);
    await this.transactFeature(req);
  }

  async getSensorAngle(deviceId = this.profile.wiredDeviceId): Promise<number> {
    if (this.profile.isNewProtocol) {
      const req = featureCmd(2, 2, 1, 148, deviceId);
      const res = await this.transactFeature(req);
      const raw = res[this.featureDataIndex()];
      return raw > 127 ? -(255 - raw + 1) : raw;
    }
    // OEM getAngleTune
    const req = legacyCmd(1, 149, 0);
    const res = await this.transactFeatureLegacy(req);
    return res[this.legacyPayloadIndex()];
  }

  async getMotionSync(deviceId = this.profile.wiredDeviceId): Promise<boolean> {
    if (!this.profile.isNewProtocol) {
      // OEM getMotionSyncGW
      const req = legacyCmd(1, 145, 0);
      const res = await this.transactFeatureLegacy(req);
      return res[this.legacyPayloadIndex()] === 1;
    }
    const req = featureCmd(2, 2, 1, 137, deviceId);
    const res = await this.transactFeature(req);
    return res[this.featureDataIndex()] === 1;
  }

  async getRippleControl(deviceId = this.profile.wiredDeviceId): Promise<boolean> {
    const req = featureCmd(2, 2, 1, 138, this.profile.isNewProtocol ? deviceId : 0);
    const res = await this.transactFeature(req);
    return res[this.oldOrNewDataIndex()] === 1;
  }

  async getAngleSnap(deviceId = this.profile.wiredDeviceId): Promise<boolean> {
    if (!this.profile.isNewProtocol) {
      // OEM getAngleSnapGW
      const req = legacyCmd(1, 135, 0);
      const res = await this.transactFeatureLegacy(req);
      return res[this.legacyPayloadIndex()] === 1;
    }
    const req = featureCmd(2, 2, 1, 132, deviceId);
    const res = await this.transactFeature(req);
    return res[this.featureDataIndex()] === 1;
  }

  async getProfileId(): Promise<number> {
    const req = featureCmd(2, 1, 0, 133);
    const res = await this.transactFeature(req);
    return res[this.oldFeatureDataIndex()];
  }

  async getLedEnabled(): Promise<boolean> {
    const req = legacyCmd(5, 136, 0);
    const res = await this.transactFeatureLegacy(req);
    return res[this.legacyPayloadIndex()] === 1;
  }

  async getDebounceInfo(deviceId = this.profile.wiredDeviceId): Promise<DebounceInfo> {
    if (!this.profile.isNewProtocol) {
      // OEM getDebounce — setReportOld cmd 133
      const req = legacyCmd(5, 133, 0);
      const res = await this.transactFeatureLegacy(req);
      const base = this.legacyPayloadIndex();
      return {
        beforePressMs: res[base],
        beforeReleaseMs: res[base + 1],
        afterPressMs: res[base + 2],
        afterReleaseMs: res[base + 3],
        diyEnabled: true,
      };
    }

    const req = featureCmd(2, 5, 0, 136, deviceId);
    const res = await this.transactFeature(req);
    const base = this.featureDataIndex();
    return {
      beforePressMs: res[base],
      beforeReleaseMs: res[base + 1],
      afterPressMs: res[base + 2],
      afterReleaseMs: res[base + 3],
      diyEnabled: res[base + 4] === 1,
    };
  }

  /** OEM setLiftOff (old) / setLOD (new). */
  async setLod(mm: number, profileSlot = 1): Promise<void> {
    if (!this.profile.isNewProtocol) {
      // setLiftOff: encode fractional as *10 when < 1
      const enc = mm < 1 ? Math.round(mm * 10) : Math.round(mm);
      const req = legacyCmd(1, 6, 0, enc);
      await this.transactFeatureLegacy(req);
      return;
    }
    const req = featureCmd(2, 2, 1, 8, profileSlot);
    req[7] = mm >= 1 ? Math.round(mm) : Math.round(mm * 10) | 128;
    await this.transactFeature(req);
  }

  /** OEM setMotionSyncGW / setMotionSync. */
  async setMotionSync(enabled: boolean, profileSlot = 1): Promise<void> {
    const v = enabled ? 1 : 0;
    if (!this.profile.isNewProtocol) {
      const req = legacyCmd(1, 17, 0, v);
      await this.transactFeatureLegacy(req);
      return;
    }
    const req = featureCmd(2, 2, 1, 9, profileSlot, v);
    await this.transactFeature(req);
  }

  /** OEM setAngleSnapGW / setAngleSnap. */
  async setAngleSnap(enabled: boolean, profileSlot = 1): Promise<void> {
    const v = enabled ? 1 : 0;
    if (!this.profile.isNewProtocol) {
      const req = legacyCmd(1, 7, 0, v);
      await this.transactFeatureLegacy(req);
      return;
    }
    const req = featureCmd(2, 2, 1, 4, profileSlot, v);
    await this.transactFeature(req);
  }

  /** OEM setRippleControl. */
  async setRippleControl(enabled: boolean, profileSlot = 1): Promise<void> {
    const v = enabled ? 1 : 0;
    if (this.profile.isNewProtocol) {
      const req = featureCmd(2, 2, 1, 10, profileSlot, v);
      await this.transactFeature(req);
      return;
    }
    const req = featureCmd(2, 2, 1, 10, v);
    await this.transactFeature(req);
  }

  /** OEM GetDPIStageColors → RGB hex per stage. */
  async getDpiStageColors(profileSlot: number, maxStages: number): Promise<string[]> {
    const req = featureCmd(2, 22, 2, 129, profileSlot);
    const res = await this.transactFeature(req);
    const base = this.featureDataIndex();
    const colors: string[] = [];
    for (let i = 0; i < maxStages; i++) {
      const r = res[base + i * 3] ?? 0;
      const g = res[base + i * 3 + 1] ?? 0;
      const b = res[base + i * 3 + 2] ?? 0;
      colors.push(
        `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
          .toString(16)
          .padStart(2, '0')}`,
      );
    }
    return colors;
  }

  /**
   * OEM SetDPIStageColors(profile, rgbBytes).
   * Frame: [2]=2,[3]=22,[4]=2,[5]=1,[6]=profile,[7…]=RGB triples.
   */
  async setDpiStageColors(profileSlot: number, colors: string[]): Promise<void> {
    const req = new Uint8Array(REPORT_SIZE);
    req[2] = 2;
    req[3] = 22;
    req[4] = 2;
    req[5] = 1;
    req[6] = profileSlot;
    const n = Math.min(this.profile.dpiMaxStages, colors.length);
    for (let i = 0; i < n; i++) {
      const rgb = parseCssColor(colors[i] ?? '#ffffff');
      req[7 + i * 3] = rgb[0];
      req[7 + i * 3 + 1] = rgb[1];
      req[7 + i * 3 + 2] = rgb[2];
    }
    await this.transactFeature(req);
  }

  /**
   * OEM setDPIStageInfo(profile, stageCount, packedXyBytes, byteLen).
   * Frame: [2]=2,[3]=30,[4]=1,[5]=1,[6]=profile,[7]=count,[8…]=BE x/y pairs.
   */
  async setDpiStageInfo(
    profileSlot: number,
    stageCount: number,
    pairs: Array<{ x: number; y: number }>,
  ): Promise<void> {
    const count = Math.max(1, Math.min(this.profile.dpiMaxStages, stageCount));
    const req = new Uint8Array(REPORT_SIZE);
    req[2] = 2;
    req[3] = 30;
    req[4] = 1;
    req[5] = 1;
    req[6] = profileSlot;
    req[7] = count;
    for (let i = 0; i < count; i++) {
      const x = Math.max(50, Math.min(this.profile.dpiMax, pairs[i]?.x ?? 800));
      const y = Math.max(50, Math.min(this.profile.dpiMax, pairs[i]?.y ?? x));
      const base = 8 + i * 4;
      req[base] = (x >> 8) & 0xff;
      req[base + 1] = x & 0xff;
      req[base + 2] = (y >> 8) & 0xff;
      req[base + 3] = y & 0xff;
    }
    await this.transactFeature(req);
  }

  /**
   * OEM setActiveDPIValue — read table, patch one 1-based stage, write back.
   */
  async setDpiStageValue(
    profileSlot: number,
    stage1Based: number,
    dpiX: number,
    dpiY = dpiX,
  ): Promise<void> {
    const info = await this.getDpiStageInfo(profileSlot, this.profile.dpiMaxStages);
    const count = Math.max(1, info.stageCount || 1);
    const stage = Math.max(1, Math.min(count, stage1Based));
    const pairs: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i++) {
      pairs.push({
        x: info.x[i] ?? 800,
        y: info.y[i] ?? info.x[i] ?? 800,
      });
    }
    pairs[stage - 1] = { x: dpiX, y: dpiY };
    await this.setDpiStageInfo(profileSlot, count, pairs);
  }

  /** OEM getCompitiveMode / setCompitiveMode (legacy). */
  async getCompetitiveMode(): Promise<boolean> {
    const req = legacyCmd(1, 148, 0);
    const res = await this.transactFeatureLegacy(req);
    return res[this.legacyPayloadIndex()] === 1;
  }

  async setCompetitiveMode(enabled: boolean): Promise<void> {
    const req = legacyCmd(1, 20, 0, enabled ? 1 : 0);
    await this.transactFeatureLegacy(req);
  }

  /** OEM setDebounce(selectValue, dataBytes[3]). */
  async setDebounceInfo(info: DebounceInfo): Promise<void> {
    if (!this.profile.isNewProtocol) {
      const req = legacyCmd(
        5,
        5,
        0,
        info.beforePressMs & 0xff,
        info.beforeReleaseMs & 0xff,
      );
      req[6] = info.afterPressMs & 0xff;
      req[7] = info.afterReleaseMs & 0xff;
      await this.transactFeatureLegacy(req);
      return;
    }
    // New-protocol debounce write not needed for Fenrir Max
    throw new Error('setDebounceInfo: new-protocol path not implemented');
  }

  /** OEM getWheelDebounce / setWheelDebounce. */
  async getWheelDebounce(): Promise<{ rate: number; ms: number }> {
    const req = legacyCmd(2, 146, 0);
    const res = await this.transactFeatureLegacy(req);
    const base = this.legacyPayloadIndex();
    return { rate: res[base], ms: res[base + 1] };
  }

  async setWheelDebounce(rate: number, ms: number): Promise<void> {
    const req = legacyCmd(2, 18, 0, rate & 0xff, ms & 0xff);
    await this.transactFeatureLegacy(req);
  }

  /** OEM setAngleTune — signed degrees. */
  async setSensorAngle(degrees: number): Promise<void> {
    let enc = Math.round(degrees);
    if (enc <= 0) enc = 255 - Math.abs(enc) + 1;
    enc = enc & 0xff;
    if (!this.profile.isNewProtocol) {
      const req = legacyCmd(1, 21, 0, enc);
      await this.transactFeatureLegacy(req);
      return;
    }
    const req = featureCmd(2, 2, 1, 20, 1, enc);
    await this.transactFeature(req);
  }

  /** OEM setDPIXYOnOff — old: [6]=onOff; new: [6]=profile,[7]=onOff. */
  async setDpiAxisSync(enabled: boolean, profileSlot = 1): Promise<void> {
    const v = enabled ? 1 : 0;
    if (this.profile.isNewProtocol) {
      const req = featureCmd(2, 2, 1, 13, profileSlot, v);
      await this.transactFeature(req);
      return;
    }
    // Fenrir Max (old): only on/off in byte[6] — profile arg ignored by firmware.
    const req = featureCmd(2, 2, 1, 13, v);
    await this.transactFeature(req);
  }

  /** OEM getLedState → {enabled, effectId}. */
  async getLedState(): Promise<{ enabled: boolean; effectId: number }> {
    const req = legacyCmd(5, 136, 0);
    const res = await this.transactFeatureLegacy(req);
    const base = this.legacyPayloadIndex();
    return { enabled: res[base] === 1, effectId: res[base + 1] ?? 0 };
  }

  async setLedState(enabled: boolean, effectId = 0): Promise<void> {
    // OEM ea(): when turning LED on with effect 0, force Static (1).
    const effect = enabled ? (effectId || 1) & 0xff : effectId & 0xff;
    const req = legacyCmd(5, 8, 0, enabled ? 1 : 0, effect);
    await this.transactFeatureLegacy(req);
  }

  /**
   * OEM getGWButton — 36-byte payload (6 slots × 6), starts at legacyPayloadIndex.
   */
  async getGwButtons(): Promise<Uint8Array> {
    const req = legacyCmd(36, 132, 0);
    const res = await this.transactFeatureLegacy(req);
    const start = this.legacyPayloadIndex();
    const out = new Uint8Array(36);
    for (let i = 0; i < 36; i++) out[i] = res[start + i] ?? 0;
    // OEM: zero length → 1
    for (let s = 0; s < 6; s++) {
      if (out[s * 6 + 1] === 0) out[s * 6 + 1] = 1;
    }
    return out;
  }

  /** OEM setGWButton(36 payload bytes). */
  async setGwButtons(payload: Uint8Array): Promise<void> {
    const req = new Uint8Array(REPORT_SIZE);
    req[1] = 36;
    req[2] = 4;
    req[3] = 0;
    req.set(payload.subarray(0, 36), 4);
    await this.transactFeatureLegacy(req);
  }

  /** OEM resetDevice — fire-and-forget. */
  async resetDevice(): Promise<void> {
    const req = legacyCmd(1, 9, 0, 1);
    await this.sendFeatureReport(req, true);
  }

  /** OEM getSensorModel — raw byte at [11-hidIndex]. */
  async getSensorModelId(): Promise<number> {
    const req = legacyCmd(7, 129, 1);
    const res = await this.transactFeatureLegacy(req);
    return res[11 - this.hidIndex] ?? 0;
  }

  /** Główna metoda - zwraca % baterii (0–100) lub rzuca błąd. */
  async getBatteryPercent(): Promise<number> {
    const level = await this.getBatteryLevel();
    if (!level || !isValidBatteryPercent(level.percent)) {
      throw new Error('Nie udało się odczytać poziomu baterii');
    }
    return level.percent;
  }

  async getBatteryLevel(): Promise<BatteryLevel | null> {
    const attempts: Array<() => Promise<BatteryLevel | null>> = [];

    if (!this.isWired && !this.profile.isNewProtocol) {
      // Fenir Max / stary protokół przez dongle - feature report działa, sendReport(8) często nie
      attempts.push(
        () => this.safeBatteryRead(() => this.getBatteryFromOldFeatureReport()),
        () => this.safeBatteryRead(() => this.getBatteryFromFeatureReport()),
        () => this.safeBatteryRead(() => this.getBatteryFromOutputReport())
      );
    } else if (!this.isWired) {
      attempts.push(
        () => this.safeBatteryRead(() => this.getBatteryFromOutputReport()),
        () => this.safeBatteryRead(() => this.getBatteryFromFeatureReport()),
        () => this.safeBatteryRead(() => this.getBatteryFromOldFeatureReport())
      );
    } else {
      attempts.push(
        () => this.safeBatteryRead(() => this.getBatteryFromFeatureReport()),
        () => this.safeBatteryRead(() => this.getBatteryFromOldFeatureReport()),
        () => this.safeBatteryRead(() => this.getBatteryFromOutputReport())
      );
    }

    for (const attempt of attempts) {
      const result = await attempt();
      if (result) return result;
    }
    return null;
  }

  private async safeBatteryRead(fn: () => Promise<BatteryLevel | null>): Promise<BatteryLevel | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  private async getBatteryFromFeatureReport(): Promise<BatteryLevel | null> {
    const req = featureCmd(2, 2, 0, 131);
    await this.sendFeatureReport(req, false);
    await this.sleep(100);
    let res = await this.receiveFeatureReport();
    res = await this.retrySetGet(req, res);

    if (res[1] === HID_ACK && res[4] === 2 && res[6] === 131) {
      return this.toBatteryLevel(res[7], res[8], 'feature', res);
    }
    if (res[0] === HID_ACK && res[3] === 2 && res[5] === 131) {
      return this.toBatteryLevel(res[6], res[7], 'feature', res);
    }
    return null;
  }

  private parseLegacyBatteryResponse(res: Uint8Array): BatteryLevel | null {
    // Odpowiedź cmd 143 (0x8f): a1 02 8f [sub] [status] [percent]
    // np. a1 02 8f 01 00 64 → status=0, percent=100
    if (res[0] === HID_ACK && res[1] === 2 && res[2] === 143) {
      return this.toBatteryLevel(res[5], res[4], 'feature-old', res);
    }
    if (res[1] === HID_ACK && res[2] === 2 && res[3] === 143) {
      return this.toBatteryLevel(res[6], res[5], 'feature-old', res);
    }
    return null;
  }

  private async getBatteryFromOldFeatureReport(): Promise<BatteryLevel | null> {
    const req = legacyCmd(2, 143, 0);
    await this.sendFeatureReport(req, true);
    await this.sleep(50);
    let res = await this.receiveFeatureReport();
    res = await this.retrySetGetOld(req, res);
    return this.parseLegacyBatteryResponse(res);
  }

  private async getBatteryFromOutputReport(): Promise<BatteryLevel | null> {
    if (!this.hasOutputReport8()) return null;

    const res = await this.transactOutput(outputCmd(DongleCommand.BatteryLevel), 50, 50);
    if (!res) return null;

    if (res[0] === DongleCommand.BatteryLevel && isValidBatteryPercent(res[6])) {
      return this.toBatteryLevel(res[6], res[5], 'output', res);
    }

    for (let offset = 0; offset <= 2; offset++) {
      const pct = res[6 + offset];
      const status = res[5 + offset];
      if (isValidBatteryPercent(pct)) {
        return this.toBatteryLevel(pct, status, 'output', res);
      }
    }

    return null;
  }

  private hasOutputReport8(): boolean {
    if (!this.outputDevice) return false;
    for (const collection of this.outputDevice.collections) {
      if (collection.outputReports?.some((r) => r.reportId === OUTPUT_REPORT_ID)) {
        return true;
      }
    }
    return false;
  }

  private async sendFeatureReport(buffer: Uint8Array, legacy: boolean): Promise<void> {
    this.assertSetReportDevice();
    const prepared = prepareReport(buffer, this.profile, legacy, this.isWired);
    const size = this.featurePayloadSize > 0 ? this.featurePayloadSize : REPORT_SIZE;
    const report =
      prepared.length === size
        ? prepared
        : (() => {
            const out = new Uint8Array(size);
            out.set(prepared.subarray(0, Math.min(prepared.length, size)));
            return out;
          })();
    await this.setReportDevice!.sendFeatureReport(
      this.featureReportId,
      report as BufferSource,
    );
    await this.sleep(this.profile.commonDelayMs);
  }

  private async receiveFeatureReport(): Promise<Uint8Array> {
    this.assertSetReportDevice();
    const data = await this.setReportDevice!.receiveFeatureReport(
      this.featureReportId,
    );
    const view = new Uint8Array(data.byteLength);
    view.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    this.updateHidIndex(view);
    return view;
  }

  private async transactFeature(send: Uint8Array, retries = 5, delayMs?: number): Promise<Uint8Array> {
    let res = new Uint8Array(REPORT_SIZE);
    for (let i = 0; i < retries; i++) {
      await this.sendFeatureReport(send, false);
      res = this.cloneBuffer(await this.receiveFeatureReport());
      res = this.cloneBuffer(await this.retrySetGet(send, res, delayMs));
      if (this.isAck(res)) return res;
    }
    if (!this.isAck(res)) throw new Error('Brak poprawnej odpowiedzi HID (feature report)');
    return res;
  }

  private async transactFeatureLegacy(send: Uint8Array): Promise<Uint8Array> {
    await this.sendFeatureReport(send, true);
    let res = this.cloneBuffer(await this.receiveFeatureReport());
    res = this.cloneBuffer(await this.retrySetGetOld(send, res));
    if (!this.isAck(res)) throw new Error('Brak poprawnej odpowiedzi HID (legacy report)');
    return res;
  }

  private async sendOutputReport(buffer: Uint8Array): Promise<void> {
    this.assertOutputDevice();
    const reportSize = this.getOutputReportByteLength() ?? 16;
    const report = new Uint8Array(reportSize);
    report.set(buffer.subarray(0, Math.min(buffer.length, reportSize)));
    const crcIndex = Math.min(15, reportSize - 1);
    report[crcIndex] = (dongleReportCrc(report, crcIndex) - OUTPUT_REPORT_ID) & 0xff;
    this.receivedOutput = null;
    await this.outputDevice!.sendReport(OUTPUT_REPORT_ID, report as BufferSource);
  }

  private getOutputReportByteLength(): number | null {
    if (!this.outputDevice) return null;
    for (const collection of this.outputDevice.collections) {
      const report = collection.outputReports?.find((r) => r.reportId === OUTPUT_REPORT_ID);
      if (report?.items?.length) {
        let bits = 0;
        for (const item of report.items) {
          bits += (item.reportSize ?? 0) * (item.reportCount ?? 0);
        }
        return Math.max(1, Math.ceil(bits / 8));
      }
    }
    return null;
  }

  private async transactOutput(send: Uint8Array, waitMs = 50, attempts = 50): Promise<Uint8Array | null> {
    return this.withOutputLock(async () => {
      for (let i = 0; i < attempts; i++) {
        await this.sendOutputReport(send);
        await this.sleep(waitMs);
        if (this.receivedOutput && this.receivedOutput[0] === send[0]) {
          return new Uint8Array(this.receivedOutput);
        }
      }
      return this.receivedOutput ? new Uint8Array(this.receivedOutput) : null;
    });
  }

  private async withOutputLock<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.outputLock;
    let release!: () => void;
    this.outputLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  private cloneBuffer(buf: Uint8Array): Uint8Array<ArrayBuffer> {
    const copy = new Uint8Array(buf.length);
    copy.set(buf);
    return copy;
  }

  private async retrySetGet(send: Uint8Array, response: Uint8Array, delayMs?: number): Promise<Uint8Array> {
    const delay = delayMs ?? this.profile.commonDelayMs;
    const ackAt = this.ackIndex();
    if (response[ackAt] === HID_ACK || response[ackAt] === 2) return response;

    for (let i = 0; i < 5; i++) {
      if (response[ackAt] > HID_ACK) {
        await this.sleep(delay);
        response.fill(0);
        await this.sendFeatureReport(send, false);
        await this.sleep(delay);
        response = this.cloneBuffer(await this.receiveFeatureReport());
        if (response[ackAt] === HID_ACK) return response;
      } else {
        for (let j = 0; j < 10; j++) {
          await this.sleep(delay);
          response.fill(0);
          response = this.cloneBuffer(await this.receiveFeatureReport());
          if (response[ackAt] === HID_ACK) return response;
        }
        await this.sleep(delay);
        response.fill(0);
        await this.sendFeatureReport(send, false);
        await this.sleep(delay);
        response = this.cloneBuffer(await this.receiveFeatureReport());
        if (response[ackAt] === HID_ACK) return response;
      }
    }
    return response;
  }

  private async retrySetGetOld(send: Uint8Array, response: Uint8Array): Promise<Uint8Array> {
    const ackAt = this.ackIndex();
    if (response[ackAt] === HID_ACK || response[ackAt] === 2) return response;

    for (let i = 0; i < 5; i++) {
      if (response[ackAt] > HID_ACK) {
        await this.sleep(this.profile.commonDelayMs);
        response.fill(0);
        await this.sendFeatureReport(send, true);
        await this.sleep(this.profile.commonDelayMs);
        response = this.cloneBuffer(await this.receiveFeatureReport());
        if (response[ackAt] === HID_ACK) return response;
      } else {
        for (let j = 0; j < 30; j++) {
          await this.sleep(this.profile.commonDelayMs);
          response.fill(0);
          response = this.cloneBuffer(await this.receiveFeatureReport());
          if (response[ackAt] === HID_ACK) return response;
        }
        await this.sleep(this.profile.commonDelayMs);
        response.fill(0);
        await this.sendFeatureReport(send, true);
        await this.sleep(this.profile.commonDelayMs);
        response = this.cloneBuffer(await this.receiveFeatureReport());
        if (response[ackAt] === HID_ACK) return response;
      }
    }
    return response;
  }

  private toBatteryLevel(
    percent: number,
    status: number,
    source: BatteryLevel['source'],
    raw: Uint8Array
  ): BatteryLevel {
    return {
      percent,
      status,
      charging: status === 1,
      source,
      raw: [...raw],
    };
  }

  private pickSetReportDevice(devices: HIDDevice[]): HIDDevice {
    const ranked = [...devices]
      .map((device) => ({ device, feat: this.bestFeatureInfo(device) }))
      .sort((a, b) => b.feat.size - a.feat.size);

    const with64 = ranked.find((r) => r.feat.size >= 64);
    if (with64) return with64.device;

    const withAny = ranked.find((r) => r.feat.size > 0);
    if (withAny) return withAny.device;

    return devices[0];
  }

  /** Largest feature-report payload on a device (bytes), matching tray GetMaxFeatureReportLength-1. */
  private bestFeatureInfo(device: HIDDevice): { id: number; size: number } {
    let best = { id: FEATURE_REPORT_ID, size: 0 };
    for (const collection of device.collections ?? []) {
      for (const report of collection.featureReports ?? []) {
        const size = featureReportPayloadBytes(report);
        if (size > best.size) {
          best = { id: report.reportId, size };
        }
      }
    }
    return best;
  }

  private pickReadFileDevice(devices: HIDDevice[]): HIDDevice | null {
    return (
      devices.find((device) =>
        device.collections.some((collection) =>
          collection.inputReports?.some((r) => r.reportId === READFILE_REPORT_ID)
        )
      ) ?? null
    );
  }

  private pickOutputDevice(devices: HIDDevice[]): HIDDevice | null {
    return (
      devices.find((device) =>
        device.collections.some((collection) =>
          collection.outputReports?.some((r) => r.reportId === OUTPUT_REPORT_ID)
        )
      ) ?? null
    );
  }

  /** OEM: methods that always use a[8-hidIndex] (getActiveDPI, getDPIStageInfo, new-protocol getters). */
  private featureDataIndex(): number {
    return 8 - this.hidIndex;
  }

  /** OEM old-protocol feature getters: a[7-hidIndex] (getPollingRate old branch, getSleepTime, getLOD). */
  private oldFeatureDataIndex(): number {
    return 7 - this.hidIndex;
  }

  /** OEM setReportOld payload: a[5-hidIndex] (getPollRate, getLiftOff, getAngleSnapGW, …). */
  private legacyPayloadIndex(): number {
    return 5 - this.hidIndex;
  }

  private oldOrNewDataIndex(): number {
    return this.profile.isNewProtocol ? this.featureDataIndex() : this.oldFeatureDataIndex();
  }

  private updateHidIndex(buf: Uint8Array): void {
    this.hidIndex = buf[0] >= 160 ? 1 : 0;
  }

  private ackIndex(): number {
    return this.hidIndex === 1 ? 0 : 1;
  }

  private isAck(buf: Uint8Array): boolean {
    const idx = this.ackIndex();
    return buf[idx] === HID_ACK || buf[idx] === 2;
  }

  private outputListenerTargets: HIDDevice[] = [];

  private async attachOutputListener(): Promise<void> {
    this.outputListenerTargets = [
      this.readFileDevice,
      this.outputDevice,
    ].filter((d): d is HIDDevice => d != null);

    if (!this.outputListenerTargets.length && this.setReportDevice) {
      this.outputListenerTargets.push(this.setReportDevice);
    }

    this.outputListener = (event: HIDInputReportEvent) => {
      if (event.reportId !== OUTPUT_REPORT_ID && event.reportId !== READFILE_REPORT_ID) return;
      this.receivedOutput = new Uint8Array(event.data.buffer);
    };

    for (const d of this.outputListenerTargets) {
      d.addEventListener('inputreport', this.outputListener);
    }
  }

  private detachOutputListener(): void {
    if (this.outputListener) {
      for (const d of this.outputListenerTargets) {
        d.removeEventListener('inputreport', this.outputListener);
      }
    }
    this.outputListener = null;
    this.outputListenerTargets = [];
    this.receivedOutput = null;
  }

  private assertSetReportDevice(): void {
    if (!this.setReportDevice?.opened) throw new Error('Urządzenie nie jest połączone');
  }

  private assertOutputDevice(): void {
    if (!this.outputDevice?.opened) throw new Error('Interfejs output HID nie jest połączony');
  }

  private assertDevice(): void {
    this.assertSetReportDevice();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function featureReportPayloadBytes(report: HIDReportInfo): number {
  const items = (report.items ?? []) as Array<{
    reportSize?: number
    reportCount?: number
  }>;
  let bits = 0;
  for (const item of items) {
    bits += (item.reportSize ?? 0) * (item.reportCount ?? 0);
  }
  return Math.ceil(bits / 8);
}

function pad64(buffer: Uint8Array): Uint8Array {
  const out = new Uint8Array(REPORT_SIZE);
  out.set(buffer.subarray(0, REPORT_SIZE));
  return out;
}

/** Parse #RRGGBB or rgb(r,g,b) → [r,g,b]. */
function parseCssColor(color: string): [number, number, number] {
  const hex = color.trim().match(/^#?([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  }
  const rgb = color.trim().match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }
  return [255, 255, 255];
}

function prepareReport(
  buffer: Uint8Array,
  profile: MouseDeviceProfile,
  legacy: boolean,
  isWired: boolean
): Uint8Array {
  const report = pad64(buffer);
  if (legacy) {
    // OEM setReportOld: wireless sets byte[3]=1
    if (!isWired) report[3] = 1;
    return report;
  }
  // OEM setReport: always rewrite placeholder device id 2 → wiredMouseDeviceID
  if (report[2] === 2) {
    report[2] = profile.wiredDeviceId;
  }
  return report;
}

export function featureCmd(
  b2: number,
  b3: number,
  b4: number,
  b5: number,
  b6 = 0,
  b7 = 0
): Uint8Array {
  const buf = new Uint8Array(REPORT_SIZE);
  buf[2] = b2;
  buf[3] = b3;
  buf[4] = b4;
  buf[5] = b5;
  buf[6] = b6;
  buf[7] = b7;
  return buf;
}

export function legacyCmd(b1: number, b2: number, b3: number, b4 = 0, b5 = 0): Uint8Array {
  const buf = new Uint8Array(REPORT_SIZE);
  buf[1] = b1;
  buf[2] = b2;
  buf[3] = b3;
  buf[4] = b4;
  buf[5] = b5;
  return buf;
}

export function outputCmd(command: number, ...payload: number[]): Uint8Array {
  const buf = new Uint8Array(16);
  buf[0] = command;
  payload.forEach((v, i) => {
    buf[4 + i] = v;
  });
  return buf;
}

function isValidBatteryPercent(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}
