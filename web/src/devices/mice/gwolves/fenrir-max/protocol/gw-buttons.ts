import type { ButtonAction } from '../../../../types'

/** OEM old-protocol GW button function codes (Yr / Qr in mouse.xyz UI). */
export const GwFn = {
  Left: 1,
  Right: 2,
  Middle: 3,
  Backward: 4,
  Forward: 5,
  ScrollUp: 6,
  ScrollDown: 7,
  Off: 8,
  DpiUp: 9,
  DpiDown: 10,
  DpiLoop: 11,
  MediaPlayer: 12,
  PlayPause: 13,
  PreviousTrack: 14,
  NextTrack: 15,
  MediaStop: 16,
  Mute: 17,
  VolUp: 18,
  VolDown: 19,
  Email: 20,
  Calc: 21,
  MyPc: 22,
  WwwHome: 23,
  Macro1: 24,
  Macro2: 25,
  Macro3: 26,
  PollUp: 27,
  PollDown: 28,
  PollLoop: 29,
  SensorChange: 30,
} as const

export const GW_SLOT_BYTES = 6
export const GW_SLOT_COUNT = 6
export const GW_PAYLOAD_BYTES = GW_SLOT_COUNT * GW_SLOT_BYTES // 36

export function actionToGwSlot(
  action: ButtonAction,
  macroIdNum = 1,
  runTimes = 1,
): number[] {
  const slot = new Array(GW_SLOT_BYTES).fill(0)
  switch (action) {
    case 'left':
      slot[0] = GwFn.Left
      slot[1] = 1
      break
    case 'right':
      slot[0] = GwFn.Right
      slot[1] = 1
      break
    case 'middle':
      slot[0] = GwFn.Middle
      slot[1] = 1
      break
    case 'back':
      slot[0] = GwFn.Backward
      slot[1] = 1
      break
    case 'forward':
      slot[0] = GwFn.Forward
      slot[1] = 1
      break
    case 'dpi_cycle':
      slot[0] = GwFn.DpiLoop
      slot[1] = 1
      break
    case 'disabled':
      slot[0] = GwFn.Off
      slot[1] = 1
      break
    case 'macro': {
      slot[0] = GwFn.Macro1
      slot[1] = 3
      const id = Math.max(1, Math.min(0xffff, macroIdNum))
      slot[2] = (id >> 8) & 0xff
      slot[3] = id & 0xff
      slot[4] = Math.max(1, Math.min(255, runTimes))
      break
    }
    default:
      slot[0] = GwFn.Off
      slot[1] = 1
  }
  return slot
}

export function gwFnToAction(fn: number): ButtonAction {
  switch (fn) {
    case GwFn.Left:
      return 'left'
    case GwFn.Right:
      return 'right'
    case GwFn.Middle:
      return 'middle'
    case GwFn.Backward:
      return 'back'
    case GwFn.Forward:
      return 'forward'
    case GwFn.DpiLoop:
    case GwFn.DpiUp:
    case GwFn.DpiDown:
      return 'dpi_cycle'
    case GwFn.Off:
      return 'disabled'
    case GwFn.Macro1:
    case GwFn.Macro2:
    case GwFn.Macro3:
      return 'macro'
    default:
      return 'disabled'
  }
}

/** Default Fenrir Max 5-key map (KeyBindingSeq 01..05). Slot 5 unused. */
export function defaultGwButtonPayload(): Uint8Array {
  const out = new Uint8Array(GW_PAYLOAD_BYTES)
  const defaults = [
    actionToGwSlot('left'),
    actionToGwSlot('right'),
    actionToGwSlot('middle'),
    actionToGwSlot('forward'),
    actionToGwSlot('back'),
    actionToGwSlot('disabled'),
  ]
  defaults.forEach((slot, i) => {
    out.set(slot, i * GW_SLOT_BYTES)
  })
  return out
}
