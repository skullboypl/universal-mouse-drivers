import type { DeviceState } from '../../../types'
import { KING_ULTRA_BUTTONS } from './buttons'

/** Soft stage markers - muted so the sensor UI stays calm. */
export const DPI_STAGE_COLORS = [
  '#8a6a52',
  '#6a7a62',
  '#5a6a82',
  '#5a7878',
  '#8a8680',
  '#8a7048',
  '#7a6280',
] as const

export function dpiStageColor(index: number): string {
  return DPI_STAGE_COLORS[index % DPI_STAGE_COLORS.length] ?? '#6a655e'
}

/** Defaults from OEM Config.ini [Device1]. */
export const DPI_MAX_STAGES = 7

export function createDefaultState(): DeviceState {
  const grades = [800, 1600, 2400, 3200, 6400, 26000, 30000]
  const dpiStageCount = DPI_MAX_STAGES
  return {
    profileIndex: 0,
    buttons: KING_ULTRA_BUTTONS.map((b) => ({ ...b })),
    sensor: {
      dpiStages: grades.map((value, index) => ({
        index,
        value,
        color: dpiStageColor(index),
        enabled: index < dpiStageCount,
      })),
      dpiStageCount,
      activeDpiIndex: 0,
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
