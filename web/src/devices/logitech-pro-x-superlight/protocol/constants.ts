/**
 * HID++ 2.0 feature IDs used by PRO X SUPERLIGHT gen1 (live FeatureSet).
 * Source: OMM 2.6.1749 symbols + tools/logitech_superlight_hidpp_probe.py
 */
export const HIDPP = {
  ROOT: 0x0000,
  FEATURE_SET: 0x0001,
  DEVICE_INFO: 0x0003,
  DEVICE_NAME: 0x0005,
  BATTERY_UNIFIED: 0x1004,
  ADJUSTABLE_DPI: 0x2201,
  REPORT_RATE: 0x8060,
  EFFECTS: 0x8070,
  ONBOARD_PROFILES: 0x8100,
  ONBOARD_BUTTONS: 0x8110,
} as const

export const REPORT_SHORT = 0x10
export const REPORT_LONG = 0x11

/** Default paired mouse index on LIGHTSPEED receiver C547. */
export const DEFAULT_DEVICE_INDEX = 0x01
