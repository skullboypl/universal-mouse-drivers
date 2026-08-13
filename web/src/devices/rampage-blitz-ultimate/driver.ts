import type { HidUsbDriverSkin } from '../hidusb-skin'
import { KingUltraDriver } from '../redragon-king-ultra/driver'
import {
  actionToKeyFun,
  BLITZ_ULTIMATE_BUTTONS,
  keyFunToAction,
} from './buttons'
import { createDefaultState, DPI_MAX_STAGES } from './defaults'
import { BLITZ_ULTIMATE_IDENTITY } from './identity'

/** Distinct Rampage Blitz skin — same HIDUsb wire, different PID/buttons/DPI. */
export const BLITZ_ULTIMATE_SKIN: HidUsbDriverSkin = {
  identity: BLITZ_ULTIMATE_IDENTITY,
  buttons: BLITZ_ULTIMATE_BUTTONS,
  createDefaultState,
  dpiMaxStages: DPI_MAX_STAGES,
  dongleProductIds: [0xf563],
  allowDemo: false,
  actionToKeyFun,
  keyFunToAction,
}

/** Separate catalog driver for Rampage Blitz Ultimate (3554:F562 / F563). */
export class BlitzUltimateDriver extends KingUltraDriver {
  constructor() {
    super(BLITZ_ULTIMATE_SKIN)
  }
}
