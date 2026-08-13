import type { DeviceState } from '../../../types'
import { BLITZ_ULTIMATE_BUTTONS } from './buttons'

/** Soft stage markers — Rampage red accent family. */
export const DPI_STAGE_COLORS = [
  '#e28020',
  '#e21f1c',
  '#20c040',
  '#2040e2',
  '#20c0c0',
  '#e020e0',
] as const

export function dpiStageColor(index: number): string {
  return DPI_STAGE_COLORS[index % DPI_STAGE_COLORS.length] ?? '#e2211c'
}

/** OEM Config.ini [Device1] DPIMaxGrade=6. */
export const DPI_MAX_STAGES = 6

export function createDefaultState(): DeviceState {
  // DPIGrade=400,800,1600,3200,6400,30000,… — first 6 are active grades.
  const grades = [400, 800, 1600, 3200, 6400, 30000]
  const dpiStageCount = DPI_MAX_STAGES
  return {
    profileIndex: 0,
    buttons: BLITZ_ULTIMATE_BUTTONS.map((b) => ({ ...b })),
    sensor: {
      dpiStages: grades.map((value, index) => ({
        index,
        value,
        color: dpiStageColor(index),
        enabled: index < dpiStageCount,
      })),
      dpiStageCount,
      activeDpiIndex: 1, // DefaultDPI=2 (1-based) → index 1 = 800
      reportRate: 2000,
      lodMm: 1,
      mode: 'corded',
      peakPerformance: true,
      peakPerformanceTimeoutMin: 15,
      rippleControl: false,
      angleSnapping: false,
      motionSync: true,
      debounceMs: 8,
      debounceEnabled: true,
    },
    macros: [],
    settings: {
      language: 'pl',
      sleepAfterMin: 1,
      longDistance: false,
      runOnBoot: false,
    },
    info: {
      driveVersion: '0.1.0-web',
      receiverFirmware: '-',
      mouseFirmware: '-',
      batteryPercent: null,
      charging: true,
      connection: 'unknown',
    },
  }
}

export const REPORT_RATES = [125, 250, 500, 1000, 2000, 4000, 8000] as const
export const DPI_MIN = 50
export const DPI_MAX = 30000
export const DPI_STEP = 50
