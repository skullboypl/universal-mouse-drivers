import type { ButtonAction, ButtonBinding } from '../types'

/** OEM Buttons art `2Button/dev1.png` = 432×356 (Blitz Ultimate). */
export const BLITZ_MOUSE_ART = { width: 432, height: 356 } as const

/**
 * Remappable keys from OEM Config.ini KeyParamN = x,y,flashIndex,type,p1,p2.
 * KeyParam6 = Fire key (type 0x04) — not DPI cycle like King Ultra.
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

/** Map UI action → KeyFunMap (Blitz Language XML KeyFunction). */
export function actionToKeyFun(action: ButtonAction): {
  type: number
  param1: number
  param2: number
} {
  switch (action) {
    case 'left':
      return { type: 0x01, param1: 0x01, param2: 0x00 }
    case 'right':
      return { type: 0x01, param1: 0x02, param2: 0x00 }
    case 'middle':
      return { type: 0x01, param1: 0x04, param2: 0x00 }
    case 'back':
      return { type: 0x01, param1: 0x08, param2: 0x00 }
    case 'forward':
      return { type: 0x01, param1: 0x10, param2: 0x00 }
    case 'dpi_cycle':
      return { type: 0x02, param1: 0x01, param2: 0x00 }
    case 'fire':
      return { type: 0x04, param1: 0x00, param2: 0x00 }
    case 'macro':
      return { type: 0x06, param1: 0x00, param2: 0x00 }
    case 'disabled':
    default:
      return { type: 0x00, param1: 0x00, param2: 0x00 }
  }
}

export function keyFunToAction(
  type: number,
  param1: number,
  param2: number,
): ButtonAction {
  if (type === 0) return 'disabled'
  if (type === 2 && param1 === 1) return 'dpi_cycle'
  if (type === 4) return 'fire'
  if (type === 6) return 'macro'
  if (type === 1) {
    if (param1 === 0x01) return 'left'
    if (param1 === 0x02) return 'right'
    if (param1 === 0x04) return 'middle'
    if (param1 === 0x08) return 'back'
    if (param1 === 0x10) return 'forward'
  }
  void param2
  return 'disabled'
}
