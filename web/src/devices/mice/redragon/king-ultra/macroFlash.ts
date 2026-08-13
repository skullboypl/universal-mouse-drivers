/**
 * King Ultra MacroKey flash packing (SKU-local).
 * Wire layout from ProtocolDataCompareUpdate → WriteFlashData @ 0x300 + i×0x180.
 */
import type { Macro, MacroEvent, MacroPlayMode } from '../../../types'
import {
  buildFrame,
  protocolChecksum,
  UsbCommandId,
  type EncodedReport,
} from './protocol'

export const MACRO_FLASH_BASE = 0x300
export const MACRO_FLASH_STRIDE = 0x180
export const MACRO_MAX_EVENTS = 70
export const MACRO_NAME_MAX = 30
/** OEM WriteFlash chunk size (FUN_180007830). */
export const MACRO_FLASH_CHUNK = 10

/** KeyFun type=6 param2 (CycleTimes). */
export function cycleTimesFromPlayMode(
  playMode: MacroPlayMode,
  times: number,
): number {
  switch (playMode) {
    case 'until_this_key':
      return 253
    case 'until_released':
      return 254
    case 'until_pressed':
      return 255
    case 'times':
    default: {
      const n = Math.max(1, Math.min(250, Math.floor(times) || 1))
      return n
    }
  }
}

export function playModeFromCycleTimes(cycle: number): {
  playMode: MacroPlayMode
  times: number
} {
  if (cycle === 253) return { playMode: 'until_this_key', times: 1 }
  if (cycle === 254) return { playMode: 'until_released', times: 1 }
  if (cycle >= 251) return { playMode: 'until_pressed', times: 1 }
  return { playMode: 'times', times: Math.max(1, cycle || 1) }
}

export function macroFlashAddress(flashIndex: number): number {
  return MACRO_FLASH_BASE + (flashIndex & 0x0f) * MACRO_FLASH_STRIDE
}

/** USB HID keyboard usage / modifier → OEM MacroContext type+value. */
export function keyboardCodeToMacroHid(code: string): {
  type: number
  value: number
} | null {
  const mod: Record<string, number> = {
    ControlLeft: 0x01,
    ControlRight: 0x10,
    ShiftLeft: 0x02,
    ShiftRight: 0x20,
    AltLeft: 0x04,
    AltRight: 0x40,
    MetaLeft: 0x08,
    MetaRight: 0x80,
  }
  if (code in mod) return { type: 0 /* Modify */, value: mod[code]! }

  const usage: Record<string, number> = {
    KeyA: 0x04,
    KeyB: 0x05,
    KeyC: 0x06,
    KeyD: 0x07,
    KeyE: 0x08,
    KeyF: 0x09,
    KeyG: 0x0a,
    KeyH: 0x0b,
    KeyI: 0x0c,
    KeyJ: 0x0d,
    KeyK: 0x0e,
    KeyL: 0x0f,
    KeyM: 0x10,
    KeyN: 0x11,
    KeyO: 0x12,
    KeyP: 0x13,
    KeyQ: 0x14,
    KeyR: 0x15,
    KeyS: 0x16,
    KeyT: 0x17,
    KeyU: 0x18,
    KeyV: 0x19,
    KeyW: 0x1a,
    KeyX: 0x1b,
    KeyY: 0x1c,
    KeyZ: 0x1d,
    Digit1: 0x1e,
    Digit2: 0x1f,
    Digit3: 0x20,
    Digit4: 0x21,
    Digit5: 0x22,
    Digit6: 0x23,
    Digit7: 0x24,
    Digit8: 0x25,
    Digit9: 0x26,
    Digit0: 0x27,
    Enter: 0x28,
    Escape: 0x29,
    Backspace: 0x2a,
    Tab: 0x2b,
    Space: 0x2c,
    Minus: 0x2d,
    Equal: 0x2e,
    BracketLeft: 0x2f,
    BracketRight: 0x30,
    Backslash: 0x31,
    Semicolon: 0x33,
    Quote: 0x34,
    Backquote: 0x35,
    Comma: 0x36,
    Period: 0x37,
    Slash: 0x38,
    CapsLock: 0x39,
    F1: 0x3a,
    F2: 0x3b,
    F3: 0x3c,
    F4: 0x3d,
    F5: 0x3e,
    F6: 0x3f,
    F7: 0x40,
    F8: 0x41,
    F9: 0x42,
    F10: 0x43,
    F11: 0x44,
    F12: 0x45,
    PrintScreen: 0x46,
    ScrollLock: 0x47,
    Pause: 0x48,
    Insert: 0x49,
    Home: 0x4a,
    PageUp: 0x4b,
    Delete: 0x4c,
    End: 0x4d,
    PageDown: 0x4e,
    ArrowRight: 0x4f,
    ArrowLeft: 0x50,
    ArrowDown: 0x51,
    ArrowUp: 0x52,
    NumLock: 0x53,
    NumpadDivide: 0x54,
    NumpadMultiply: 0x55,
    NumpadSubtract: 0x56,
    NumpadAdd: 0x57,
    NumpadEnter: 0x58,
    Numpad1: 0x59,
    Numpad2: 0x5a,
    Numpad3: 0x5b,
    Numpad4: 0x5c,
    Numpad5: 0x5d,
    Numpad6: 0x5e,
    Numpad7: 0x5f,
    Numpad8: 0x60,
    Numpad9: 0x61,
    Numpad0: 0x62,
    NumpadDecimal: 0x63,
  }
  if (code in usage) return { type: 1 /* Normal */, value: usage[code]! }
  return null
}

export function isMacroKeySupported(code: string): boolean {
  return keyboardCodeToMacroHid(code) != null
}

/** Short label for event list (KeyA → A, ControlLeft → Ctrl L). */
export function formatMacroKeyLabel(code: string): string {
  const map: Record<string, string> = {
    ControlLeft: 'Ctrl L',
    ControlRight: 'Ctrl R',
    ShiftLeft: 'Shift L',
    ShiftRight: 'Shift R',
    AltLeft: 'Alt L',
    AltRight: 'Alt R',
    MetaLeft: 'Win L',
    MetaRight: 'Win R',
    Space: 'Space',
    Escape: 'Esc',
    Backspace: 'Bksp',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  }
  if (map[code]) return map[code]!
  if (code.startsWith('Key') && code.length === 4) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`
  return code
}

type PackedCtx = {
  keyState: number
  type: number
  value: number
  delay: number
}

/** Fold UI events into OEM MacroContext list (delay attaches to previous). */
export function macroEventsToContexts(events: MacroEvent[]): PackedCtx[] {
  const out: PackedCtx[] = []
  for (const ev of events) {
    if (ev.kind === 'delay') {
      const ms = Math.max(0, Math.min(65535, ev.delayMs ?? 0))
      if (out.length === 0) continue
      const prev = out[out.length - 1]!
      prev.delay = Math.min(65535, prev.delay + ms)
      continue
    }
    if (!ev.key) continue
    const hid = keyboardCodeToMacroHid(ev.key)
    if (!hid) continue
    if (out.length >= MACRO_MAX_EVENTS) break
    out.push({
      keyState: ev.kind === 'up' ? 1 : 0,
      type: hid.type,
      value: hid.value,
      delay: 0,
    })
  }
  return out
}

/**
 * Pack MacroKey flash blob.
 * [0]=nameLen [1..]=name [0x1F]=count [0x20+]=5-byte events [trail]=ck
 * Checksum = 0x55-sum over [0x1F .. 0x20+5N) (exclusive end).
 * Write length = 5N + 0x21.
 */
export function encodeMacroKeyFlash(
  name: string,
  events: MacroEvent[],
): { buffer: Uint8Array; writeLen: number } {
  const buf = new Uint8Array(MACRO_FLASH_STRIDE)
  buf.fill(0xff)
  const nameBytes: number[] = []
  for (let i = 0; i < name.length && nameBytes.length < MACRO_NAME_MAX; i++) {
    const c = name.charCodeAt(i)
    if (c > 0 && c < 256) nameBytes.push(c)
  }
  buf[0] = nameBytes.length
  for (let i = 0; i < nameBytes.length; i++) buf[1 + i] = nameBytes[i]!

  const ctx = macroEventsToContexts(events)
  const n = Math.min(MACRO_MAX_EVENTS, ctx.length)
  buf[0x1f] = n
  for (let i = 0; i < n; i++) {
    const c = ctx[i]!
    const off = 0x20 + i * 5
    let b0 = c.type & 0x0f
    if (c.keyState === 0) b0 |= 0x80
    else if (c.keyState === 1) b0 |= 0x40
    buf[off] = b0
    buf[off + 1] = c.value & 0xff
    buf[off + 2] = (c.value >> 8) & 0xff
    const d = c.delay & 0xffff
    buf[off + 3] = (d >> 8) & 0xff
    buf[off + 4] = d & 0xff
  }
  const ckEnd = 0x20 + n * 5
  const ck = protocolChecksum(buf, 0x1f, ckEnd)
  buf[ckEnd] = ck
  const writeLen = n * 5 + 0x21
  return { buffer: buf, writeLen }
}

/** Chunked WriteFlashData frames (10-byte payload chunks). */
export function encodeWriteFlashChunks(
  address: number,
  data: ArrayLike<number>,
  length?: number,
): EncodedReport[] {
  const len = length ?? data.length
  const out: EncodedReport[] = []
  let offset = 0
  let addr = address
  while (offset < len) {
    const chunk = Math.min(MACRO_FLASH_CHUNK, len - offset)
    const payload: number[] = []
    for (let i = 0; i < chunk; i++) payload.push(data[offset + i]! & 0xff)
    out.push(
      buildFrame({
        commandId: UsbCommandId.WriteFlashData,
        address: addr,
        dataLen: chunk,
        payload,
      }),
    )
    offset += chunk
    addr += chunk
  }
  return out
}

export function encodeMacroKeyWrite(
  flashIndex: number,
  macro: Pick<Macro, 'name' | 'events'>,
): EncodedReport[] {
  const { buffer, writeLen } = encodeMacroKeyFlash(macro.name, macro.events)
  return encodeWriteFlashChunks(
    macroFlashAddress(flashIndex),
    buffer,
    writeLen,
  )
}

export function macroKeyFunParams(
  flashIndex: number,
  macro: Pick<Macro, 'playMode' | 'times'>,
): { type: number; param1: number; param2: number } {
  return {
    type: 0x06,
    param1: flashIndex & 0xff,
    param2: cycleTimesFromPlayMode(macro.playMode, macro.times),
  }
}
