import type { DeviceState } from '../../../types'
import { SUPERLIGHT_BUTTONS } from './buttons'

/** Gen1 Superlight: 100-25600, step 50 (HID++ 0x2201 live list). */
export const SUPERLIGHT_DPI_MIN = 100
export const SUPERLIGHT_DPI_MAX = 25600
export const SUPERLIGHT_DPI_STEP = 50
export const SUPERLIGHT_DPI_MAX_STAGES = 5

/** Typical LIGHTSPEED 1 rates (0x8060). Refined after probe bitmask. */
export const SUPERLIGHT_REPORT_RATES = [125, 250, 500, 1000] as const

/**
 * OMM factory DPI table for profiles 1/2/3/5 (live dump after restore).
 * Profile 4 factory has only 400/800 enabled.
 */
export const SUPERLIGHT_FACTORY_DPI_GRADES = [
  400, 800, 1600, 3200, 6400,
] as const

export function superlightDpiColor(index: number): string {
  const palette = ['#00a0e3', '#7ac143', '#f6be00', '#e35205', '#c8102e']
  return palette[index % palette.length]!
}

export function createSuperlightDefaultState(): DeviceState {
  // Match OMM factory profile 1 (sectors 1/2/3/5 after restore defaults).
  const grades = [...SUPERLIGHT_FACTORY_DPI_GRADES]
  const dpiStageCount = 5
  const defaultDpiIndex = 1 // 800
  const dpiShiftIndex = 0 // 400
  return {
    profileIndex: 0,
    buttons: SUPERLIGHT_BUTTONS.map((b) => ({ ...b })),
    sensor: {
      dpiStages: grades.map((value, index) => ({
        index,
        value,
        color: superlightDpiColor(index),
        enabled: index < dpiStageCount,
      })),
      dpiStageCount,
      activeDpiIndex: defaultDpiIndex,
      defaultDpiIndex,
      dpiShiftIndex,
      dpiListMin: SUPERLIGHT_DPI_MIN,
      dpiListMax: SUPERLIGHT_DPI_MAX,
      dpiListStep: SUPERLIGHT_DPI_STEP,
      reportRate: 1000,
      lodMm: 1,
      mode: 'lp',
      peakPerformance: false,
      peakPerformanceTimeoutMin: 15,
      rippleControl: false,
      angleSnapping: false,
      motionSync: false,
      debounceMs: 0,
      debounceEnabled: false,
    },
    macros: [],
    settings: {
      language: 'pl',
      sleepAfterMin: 0,
      longDistance: false,
      runOnBoot: false,
    },
    info: {
      driveVersion: '0.1.0-web',
      receiverFirmware: '-',
      mouseFirmware: '-',
      batteryPercent: null,
      charging: false,
      connection: 'wireless',
    },
  }
}
