import type { DeviceState } from '../../../types'
import { FENRIR_MAX_BUTTONS } from './buttons'
import { FENRIR_SLEEP_DEFAULT_SEC } from './sleep'
import { fenrirDpiColor } from './theme'

export const FENRIR_DPI_MAX_STAGES = 7
export const FENRIR_DPI_MIN = 50
export const FENRIR_DPI_MAX = 30000
export const FENRIR_DPI_STEP = 50
export const FENRIR_REPORT_RATES = [
  125, 250, 500, 1000, 2000, 4000, 8000,
] as const

/** Soft defaults until HID sync fills real values. OEM DefaultDPIColors. */
export function createFenrirDefaultState(): DeviceState {
  const grades = [400, 800, 1600, 3200, 6400, 12000, 26000]
  const dpiStageCount = FENRIR_DPI_MAX_STAGES
  return {
    profileIndex: 0,
    buttons: FENRIR_MAX_BUTTONS.map((b) => ({ ...b })),
    sensor: {
      dpiStages: grades.map((value, index) => ({
        index,
        value,
        valueY: value,
        color: fenrirDpiColor(index),
        enabled: index < dpiStageCount,
      })),
      dpiStageCount,
      activeDpiIndex: 0,
      reportRate: 1000,
      lodMm: 1,
      mode: 'lp',
      peakPerformance: false,
      peakPerformanceTimeoutMin: 15,
      rippleControl: false,
      angleSnapping: false,
      motionSync: false,
      debounceMs: 2,
      debounceEnabled: false,
      debounceLevel: 0,
      debounceBeforePress: 2,
      debounceBeforeRelease: 5,
      debounceAfterPress: 35,
      debounceAfterRelease: 10,
      wheelDebounceMs: 8,
      wheelDebounceDiy: false,
      wheelDebounceRate: 0,
      wheelDebounceLevel: 0,
      dpiAxisSync: true,
      ledEnabled: true,
      ledEffect: 1,
      sensorAngle: 0,
    },
    macros: [],
    settings: {
      language: 'pl',
      sleepAfterMin: 1,
      sleepAfterSec: FENRIR_SLEEP_DEFAULT_SEC,
      longDistance: false,
      runOnBoot: false,
    },
    info: {
      driveVersion: '0.1.0-web',
      receiverFirmware: '-',
      mouseFirmware: '-',
      batteryPercent: null,
      charging: false,
      connection: 'unknown',
    },
  }
}
