import type { ButtonBinding, DeviceIdentity } from '../../types'

/** Fictional generated mouse for "Try demo profile" - not Redragon / King Ultra. */
export const DEMO_IDENTITY: DeviceIdentity = {
  id: 'umd-demo',
  brand: 'UMD',
  model: 'Demo Mouse',
  tagline: 'Generated preview mouse - no hardware required',
  vendorId: 0,
  productIds: [],
  hidIds: ['demo'],
  status: 'live',
  sensor: 'Virtual',
  /** Dedicated studio PNG (not King Ultra OEM art). */
  imageUrl: '/devices/demo/mouse.png',
  artWidth: 1536,
  artHeight: 1024,
}

/** Badge positions for /devices/demo/mouse.png (1536×1024). */
export const DEMO_BUTTONS: ButtonBinding[] = [
  {
    id: 1,
    flashIndex: 0x00,
    label: 'Left Button',
    action: 'left',
    uiX: 690,
    uiY: 420,
  },
  {
    id: 2,
    flashIndex: 0x01,
    label: 'Right Button',
    action: 'right',
    uiX: 980,
    uiY: 430,
  },
  {
    id: 3,
    flashIndex: 0x02,
    label: 'Middle Button',
    action: 'middle',
    uiX: 835,
    uiY: 340,
  },
  {
    id: 4,
    flashIndex: 0x04,
    label: 'Forward',
    action: 'forward',
    uiX: 470,
    uiY: 500,
  },
  {
    id: 5,
    flashIndex: 0x03,
    label: 'Back',
    action: 'back',
    uiX: 500,
    uiY: 620,
  },
  {
    id: 6,
    flashIndex: 0x0c,
    label: 'DPI Cycle',
    action: 'dpi_cycle',
    uiX: 835,
    uiY: 270,
  },
]
