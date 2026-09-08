import type { ButtonAction, ButtonBinding } from '../../../types'
import {
  actionToKeyFun as mapAction,
  keyFunToAction as mapKeyFun,
  KING_ULTRA_BUTTON_ACTIONS,
  type KingActionDef,
  type KingButtonActionGroup,
} from './actions'

export type { KingActionDef, KingButtonActionGroup }
export { KING_ULTRA_BUTTON_ACTIONS }

/** OEM Buttons art `2Button/dev1.png` = 432×356 (real King Ultra). */
export const MOUSE_ART = { width: 432, height: 356 } as const

/**
 * Remappable keys on mouse art — OEM Config.ini KeyParam1–6.
 * Format: x,y,flashIndex,type,param1,param2
 *
 * Button 6 (DPI Loop): Config.ini `index=0x0C`. Factory flash also keeps
 * DPI Loop copies at slots 0x05 and 0x0B — remaps must hit all three or the
 * physical DPI key can stay on an old copy / go dead. Primary = 0x0C.
 *
 * KeyParam7–16 exist in Config (extra flash slots / OEM side list) but are
 * not drawn on the 6-button overlay in UMD — see NOTES-buttons-oem.md.
 */
export const KING_ULTRA_BUTTONS: ButtonBinding[] = [
  {
    id: 1,
    flashIndex: 0x00,
    label: 'Left Button',
    action: 'left',
    uiX: 159,
    uiY: 223,
  },
  {
    id: 2,
    flashIndex: 0x01,
    label: 'Right Button',
    action: 'right',
    uiX: 43,
    uiY: 186,
  },
  {
    id: 3,
    flashIndex: 0x02,
    label: 'Middle Button',
    action: 'middle',
    uiX: 127,
    uiY: 145,
  },
  {
    id: 4,
    flashIndex: 0x04,
    label: 'Forward',
    action: 'forward',
    uiX: 286,
    uiY: 169,
  },
  {
    id: 5,
    flashIndex: 0x03,
    label: 'Back',
    action: 'back',
    uiX: 322,
    uiY: 127,
  },
  {
    id: 6,
    flashIndex: 0x0c,
    label: 'DPI Cycle',
    action: 'dpi_cycle',
    uiX: 313,
    uiY: 240,
  },
]

/**
 * Extra KeyFun slots that factory-mirror button 6 (DPI). Write the same
 * KeyFun to these whenever remapping button 6.
 */
export const KING_ULTRA_BUTTON6_MIRROR_SLOTS = [0x05, 0x0b] as const

/** Primary + mirror KeyFun indices for a physical button. */
export function kingUltraKeyFunSlots(buttonId: number, flashIndex: number): number[] {
  if (buttonId === 6) {
    return [flashIndex, ...KING_ULTRA_BUTTON6_MIRROR_SLOTS]
  }
  return [flashIndex]
}

export function actionToKeyFun(action: ButtonAction): {
  type: number
  param1: number
  param2: number
} {
  return mapAction(action)
}

export function keyFunToAction(
  type: number,
  param1: number,
  param2: number,
): ButtonAction {
  return mapKeyFun(type, param1, param2)
}
