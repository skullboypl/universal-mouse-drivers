import type { ButtonBinding } from '../../../types'

/** OEM Config/Fenir/Device.png = 399×558. */
export const FENRIR_MAX_ART = { width: 399, height: 558 } as const

/**
 * Remappable keys from OEM KeyBindingSeq "01;02;03;04;05" (BtnMaxNum=5).
 * Badge positions are starting points for /admin (tune on Device.png).
 */
export const FENRIR_MAX_BUTTONS: ButtonBinding[] = [
  {
    id: 1,
    flashIndex: 0x00,
    label: 'Left Button',
    action: 'left',
    uiX: 150,
    uiY: 210,
  },
  {
    id: 2,
    flashIndex: 0x01,
    label: 'Right Button',
    action: 'right',
    uiX: 250,
    uiY: 210,
  },
  {
    id: 3,
    flashIndex: 0x02,
    label: 'Middle Button',
    action: 'middle',
    uiX: 200,
    uiY: 155,
  },
  {
    id: 4,
    flashIndex: 0x03,
    label: 'Forward',
    action: 'forward',
    uiX: 72,
    uiY: 270,
  },
  {
    id: 5,
    flashIndex: 0x04,
    label: 'Back',
    action: 'back',
    uiX: 62,
    uiY: 330,
  },
]
