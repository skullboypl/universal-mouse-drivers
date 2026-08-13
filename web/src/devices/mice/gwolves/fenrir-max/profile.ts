/** Fenrir Max profile (OEM ModelEN: "Fenir Max") from env-models.json. */

export interface MouseDeviceProfile {
  name: string
  vid: number
  pidWired: number
  pidWireless: number
  pidWireless4k8k: number
  isNewProtocol: boolean
  wiredDeviceId: number
  dpiMax: number
  dpiStep: number
  dpiMaxStages: number
  pollingRatesWired: number[]
  pollingRatesWireless: number[]
  /** Full 8K dongle rate list when on PID 3717. Optional for generic profiles. */
  pollingRates8k?: number[]
  commonDelayMs: number
  competitiveEnable: boolean
  dpiXyEnable: boolean
}

/** Hardcoded Fenrir Max 8K — source: FENRIR_MOUSE_DRIVERS env-models. */
export const FENRIR_MAX_PROFILE: MouseDeviceProfile = {
  name: 'Fenir Max',
  vid: 0x33e4,
  pidWired: 0x3708,
  pidWireless: 0x3717,
  pidWireless4k8k: 0x3717,
  isNewProtocol: false,
  wiredDeviceId: 2,
  dpiMax: 30000,
  dpiStep: 50,
  dpiMaxStages: 7,
  pollingRatesWired: [125, 250, 500, 1000],
  pollingRatesWireless: [125, 250, 500, 1000],
  pollingRates8k: [125, 250, 500, 1000, 2000, 4000, 8000],
  commonDelayMs: 20,
  competitiveEnable: true,
  dpiXyEnable: true,
}

export function isWiredConnection(
  profile: MouseDeviceProfile,
  pid: number,
): boolean {
  return profile.pidWired === pid
}

export function pollingRatesForPid(
  profile: MouseDeviceProfile,
  pid: number,
): number[] {
  if (pid === profile.pidWireless4k8k || pid === profile.pidWireless) {
    return profile.pollingRates8k ?? profile.pollingRatesWireless
  }
  return profile.pollingRatesWired
}
