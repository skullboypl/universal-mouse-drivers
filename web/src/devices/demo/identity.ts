import type { ButtonBinding, DeviceIdentity } from '../types'

/** Fictional / generated mouse for "Try demo profile" - not Redragon. */
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
  imageUrl: '/devices/demo/mouse.svg',
  artWidth: 1536,
  artHeight: 1024,
}

/** Badge positions tuned to the generated studio mockup (1536×1024). */
export const DEMO_BUTTONS: ButtonBinding[] = [
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
