import type { DeviceState } from '../../../types'

export function createProX3SuperstrikeDefaultState(): DeviceState {
  return {
    profileIndex: 0,
    buttons: [
      { id: 1, flashIndex: 0, label: 'Left', action: 'left', uiX: 145, uiY: 95 },
      { id: 2, flashIndex: 1, label: 'Right', action: 'right', uiX: 275, uiY: 95 },
      { id: 3, flashIndex: 2, label: 'Middle', action: 'middle', uiX: 210, uiY: 145 },
      { id: 4, flashIndex: 3, label: 'Back', action: 'back', uiX: 95, uiY: 205 },
      { id: 5, flashIndex: 4, label: 'Forward', action: 'forward', uiX: 95, uiY: 160 },
    ],
    sensor: {
      // Matches the factory ROM profile read from a physical X3 (dev log,
      // 2026-09-28): five DPI stages, LOD 2, both links at 1000 Hz, BHOP off.
      dpiStages: [800, 1200, 1600, 2400, 3200].map((value, index) => ({
        index,
        value,
        valueY: value,
        color: '#70e7ff',
        enabled: true,
      })),
      dpiStageCount: 5,
      defaultDpiIndex: 0,
      dpiShiftIndex: 0,
      activeDpiIndex: 0,
      reportRate: 1000,
      reportRateWireless: 1000,
      reportRateWired: 1000,
      lodMm: 1,
      lodLevel: 2,
      bhopEnabled: false,
      bhopTimeoutMs: 100,
      mode: 'hp',
      peakPerformance: true,
      peakPerformanceTimeoutMin: 5,
      rippleControl: false,
      angleSnapping: false,
      motionSync: false,
      debounceMs: 0,
      debounceEnabled: false,
      // OMM factory preset shown by the device: UI values are quarter-steps
      // of the raw 40/20/20 capability resolutions.
      hitsLeftActuation: 1,
      hitsRightActuation: 1,
      hitsLeftRapidTriggerEnabled: true,
      hitsRightRapidTriggerEnabled: true,
      hitsLeftRapidTriggerSensitivity: 2,
      hitsRightRapidTriggerSensitivity: 2,
      hitsLeftHaptic: 2,
      hitsRightHaptic: 2,
    },
    macros: [],
    settings: { language: 'pl', sleepAfterMin: 5, longDistance: false, runOnBoot: false },
    info: {
      driveVersion: 'UMD X3 research driver 0.1',
      receiverFirmware: 'read pending',
      mouseFirmware: 'read pending',
      batteryPercent: null,
      charging: false,
      connection: 'unknown',
    },
  }
}
