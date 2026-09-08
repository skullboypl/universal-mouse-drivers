import type { ButtonAction, ButtonBinding } from '../../../types'
import { actionToKeyFun as mapAction, keyFunToAction as mapKeyFun } from './actions'

/** OEM Buttons art `2Button/dev1.png` = 432×356 (Blitz Ultimate). */
export const BLITZ_MOUSE_ART = { width: 432, height: 356 } as const

/**
 * Remappable keys from OEM Config.ini KeyParamN = x,y,flashIndex,type,p1,p2.
 * KeyParam6 = Fire key (type 0x04) @ flashIndex 0x05 - King Ultra uses different map.
 */
export const BLITZ_ULTIMATE_BUTTONS: ButtonBinding[] = [
  {
    id: 1,
    flashIndex: 0x00,
    label: 'Left Button',
    action: 'left',
    uiX: 167,
    uiY: 235,
  },
  {
    id: 2,
    flashIndex: 0x01,
    label: 'Right Button',
    action: 'right',
    uiX: 65,
    uiY: 201,
  },
  {
    id: 3,
    flashIndex: 0x02,
    label: 'Middle Button',
    action: 'middle',
    uiX: 135,
    uiY: 146,
  },
  {
    id: 4,
    flashIndex: 0x04,
    label: 'Forward',
    action: 'forward',
    uiX: 281,
    uiY: 161,
  },
  {
    id: 5,
    flashIndex: 0x03,
    label: 'Back',
    action: 'back',
    uiX: 324,
    uiY: 110,
  },
  {
    id: 6,
    flashIndex: 0x05,
    label: 'Fire Key',
    action: 'fire',
    uiX: 376,
    uiY: 230,
  },
]

/** Blitz Ultimate KeyFun map - from Blitz Language XML only. */
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
