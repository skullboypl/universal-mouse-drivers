import type { ButtonAction, ButtonBinding, DeviceIdentity, DeviceState } from './types'

/**
 * Per-SKU skin for the shared HIDUsb V11 driver logic.
 * Protocol/wire is shared; identity, buttons, defaults stay device-specific.
 */
export type HidUsbDriverSkin = {
  identity: DeviceIdentity
  buttons: ButtonBinding[]
  createDefaultState: () => DeviceState
  dpiMaxStages: number
  /** Product IDs treated as wireless dongle for connection label. */
  dongleProductIds: number[]
  /** Allow mock → UMD demo skin (King Ultra host only). */
  allowDemo: boolean
  actionToKeyFun: (action: ButtonAction) => {
    type: number
    param1: number
    param2: number
  }
  keyFunToAction: (
    type: number,
    param1: number,
    param2: number,
  ) => ButtonAction
}
