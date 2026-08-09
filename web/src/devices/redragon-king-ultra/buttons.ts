import type { ButtonAction, ButtonBinding } from '../types'

/** Product photo space (`mouse.png` = 1536×1024). */
export const MOUSE_ART = { width: 1536, height: 1024 } as const

/**
 * Remappable keys + badge positions on the product photo (isometric).
 * flashIndex from OEM Config.ini KeyParam; uiX/uiY tuned to mouse.png.
 */
export const KING_ULTRA_BUTTONS: ButtonBinding[] = [
  {
    id: 1,
    flashIndex: 0x00,
    label: 'Left Button',
    action: 'left',
    uiX: 700,
    uiY: 430,
  },
  {
    id: 2,
    flashIndex: 0x01,
    label: 'Right Button',
    action: 'right',
    uiX: 980,
    uiY: 400,
  },
  {
    id: 3,
    flashIndex: 0x02,
    label: 'Middle Button',
    action: 'middle',
    uiX: 820,
    uiY: 360,
  },
  {
    id: 4,
    flashIndex: 0x04,
    label: 'Forward',
    action: 'forward',
    uiX: 430,
    uiY: 480,
  },
  {
    id: 5,
    flashIndex: 0x03,
    label: 'Back',
    action: 'back',
    uiX: 460,
    uiY: 600,
  },
  {
    id: 6,
    flashIndex: 0x0c,
    label: 'DPI Cycle',
    action: 'dpi_cycle',
    uiX: 860,
    uiY: 280,
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
