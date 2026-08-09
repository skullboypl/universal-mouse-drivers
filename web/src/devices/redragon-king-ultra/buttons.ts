import type { ButtonAction, ButtonBinding } from '../types'

/** OEM Buttons art `2Button/dev1.png` = 432×356 (real King Ultra). */
export const MOUSE_ART = { width: 432, height: 356 } as const

/**
 * Remappable keys + badge positions from OEM Config.ini KeyParamN = x,y,…
 * flashIndex from KeyParam; uiX/uiY match official driver overlay on dev1.png.
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

/** Map UI action → KeyFunMap type/param (Config.ini + Language XML). */
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
