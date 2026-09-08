import type { ButtonAction, ButtonBinding } from '../../../types'

/** Placeholder art until OEM product PNG is dropped in public/. */
export const SUPERLIGHT_ART = { width: 420, height: 520 } as const

/**
 * Physical buttons — order matches OMM / onboard profile `0x8100`
 * (Solaar offsets @32): Left, Right, Middle, Back, Forward.
 * Live Superlight v1 factory macros: `80 01 00 {01,02,04,08,10}`.
 * Left + Right are locked in OMM / UMD (cannot remapped).
 */
export const SUPERLIGHT_BUTTONS: ButtonBinding[] = [
  {
    id: 1,
    flashIndex: 0,
    label: 'Left',
    action: 'left',
    uiX: 160,
    uiY: 200,
  },
  {
    id: 2,
    flashIndex: 1,
    label: 'Right',
    action: 'right',
    uiX: 260,
    uiY: 200,
  },
  {
    id: 3,
    flashIndex: 2,
    label: 'Middle',
    action: 'middle',
    uiX: 210,
    uiY: 140,
  },
  {
    id: 4,
    flashIndex: 3,
    label: 'Back',
    action: 'back',
    uiX: 70,
    uiY: 310,
  },
  {
    id: 5,
    flashIndex: 4,
    label: 'Forward',
    action: 'forward',
    uiX: 70,
    uiY: 250,
  },
]

/** Button ids that must stay as physical primary clicks (OMM). */
export const SUPERLIGHT_LOCKED_BUTTON_IDS = new Set([1, 2])

/** Encode UMD ButtonAction → 4-byte onboard macro (SEND remap / FUNCTION). */
export function encodeOnboardButtonMacro(action: ButtonAction): Uint8Array {
  switch (action) {
    case 'left':
      return new Uint8Array([0x80, 0x01, 0x00, 0x01])
    case 'right':
      return new Uint8Array([0x80, 0x01, 0x00, 0x02])
    case 'middle':
      return new Uint8Array([0x80, 0x01, 0x00, 0x04])
    case 'back':
      return new Uint8Array([0x80, 0x01, 0x00, 0x08])
    case 'forward':
      return new Uint8Array([0x80, 0x01, 0x00, 0x10])
    case 'dpi_cycle':
      return new Uint8Array([0x90, 0x05, 0x00, 0x00])
    case 'disabled':
      return new Uint8Array([0x90, 0x00, 0x00, 0x00])
    default:
      return new Uint8Array([0x90, 0x00, 0x00, 0x00])
  }
}

/** Decode one 4-byte onboard macro → UMD ButtonAction (OMM HIDAction). */
export function decodeOnboardButtonMacro(bytes: Uint8Array): ButtonAction {
  if (bytes.length < 4) return 'disabled'
  const behavior = bytes[0]! >> 4
  // SEND (0x8): remapping
  if (behavior === 0x8) {
    const opcode = bytes[1]!
    if (opcode === 0 /* NO_ACTION */) return 'disabled'
    if (opcode === 1 /* BUTTON */) {
      const mask = (bytes[2]! << 8) | bytes[3]!
      switch (mask) {
        case 0x0001:
          return 'left'
        case 0x0002:
          return 'right'
        case 0x0004:
          return 'middle'
        case 0x0008:
          return 'back'
        case 0x0010:
          return 'forward'
        default:
          return 'disabled'
      }
    }
    return 'disabled'
  }
  // FUNCTION (0x9) — OMM FUNCTION_OPCODES; 5 = Cycle DPIs
  if (behavior === 0x9) {
    const fn = bytes[1]!
    if (fn === 5) return 'dpi_cycle'
    if (fn === 0) return 'disabled'
    return 'disabled'
  }
  return 'disabled'
}
