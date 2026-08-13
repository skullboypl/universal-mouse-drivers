/**
 * King Ultra (M916OB-ULT) KeyFunction / SubKeyFunction catalog.
 * Source: OEM `Language/0-English.xml` + Config.ini KeyParam encoding.
 * value="ABCD" → param1=0xCD (lo), param2=0xAB (hi).
 *
 * OWNED BY King Ultra only — never import from Blitz Ultimate.
 */
import type { ButtonAction } from '../../../types'
import { encodeWriteFlashChunks } from './macroFlash'
import { protocolChecksum, type EncodedReport } from './protocol'

export type KingButtonActionGroup =
  | 'mouse'
  | 'system'
  | 'scroll'
  | 'dpi'
  | 'media'
  | 'lighting'
  | 'macro'

export type KingActionDef = {
  id: ButtonAction
  labelKey: string
  group: KingButtonActionGroup
  type: number
  param1: number
  param2: number
  /** Media: Consumer usage for ShortCutKey flash (OEM App_AddMultiMedia). */
  mediaUsage?: [number, number]
}

function v(hex: number): { param1: number; param2: number } {
  return { param1: hex & 0xff, param2: (hex >> 8) & 0xff }
}

/**
 * Flat OEM menu leaves from King Language XML KeyFunction + SubKeyFunction.
 * Diff vs Blitz: no `led_all_toggle` (King XML only has strip + effect loop).
 */
export const KING_ULTRA_BUTTON_ACTIONS: KingActionDef[] = [
  { id: 'left', labelKey: 'left', group: 'mouse', type: 0x01, ...v(0x0001) },
  { id: 'right', labelKey: 'right', group: 'mouse', type: 0x01, ...v(0x0002) },
  { id: 'middle', labelKey: 'middle', group: 'mouse', type: 0x01, ...v(0x0004) },
  { id: 'back', labelKey: 'back', group: 'mouse', type: 0x01, ...v(0x0008) },
  { id: 'forward', labelKey: 'forward', group: 'mouse', type: 0x01, ...v(0x0010) },
  {
    id: 'polling_rate_switch',
    labelKey: 'polling_rate_switch',
    group: 'system',
    type: 0x07,
    ...v(0x0000),
  },
  /** Fire: OEM FormFireKey defaults interval=10, times=3. */
  { id: 'fire', labelKey: 'fire', group: 'system', type: 0x04, param1: 10, param2: 3 },
  { id: 'combo', labelKey: 'combo', group: 'system', type: 0x05, ...v(0x0000) },
  { id: 'disabled', labelKey: 'disabled', group: 'system', type: 0x00, ...v(0x0000) },
  { id: 'scroll_up', labelKey: 'scroll_up', group: 'scroll', type: 0x0b, ...v(0x0001) },
  { id: 'scroll_down', labelKey: 'scroll_down', group: 'scroll', type: 0x0b, ...v(0x0002) },
  { id: 'scroll_left', labelKey: 'scroll_left', group: 'scroll', type: 0x03, ...v(0x0001) },
  { id: 'scroll_right', labelKey: 'scroll_right', group: 'scroll', type: 0x03, ...v(0x0002) },
  { id: 'dpi_cycle', labelKey: 'dpi_cycle', group: 'dpi', type: 0x02, ...v(0x0001) },
  { id: 'dpi_up', labelKey: 'dpi_up', group: 'dpi', type: 0x02, ...v(0x0002) },
  { id: 'dpi_down', labelKey: 'dpi_down', group: 'dpi', type: 0x02, ...v(0x0003) },
  // DPI Lock: OEM value = dpi/50 - 1 (XML 0001→100 … 0017→1200)
  ...([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200] as const).map(
    (dpi) =>
      ({
        id: `dpi_lock_${dpi}` as ButtonAction,
        labelKey: `dpi_lock_${dpi}`,
        group: 'dpi' as const,
        type: 0x0a,
        param1: dpi / 50 - 1,
        param2: 0,
      }) satisfies KingActionDef,
  ),
  // Media: KeyFun type=5 p1=0 p2=0 + ShortCut usage @ 0x100+i×0x20
  ...(
    [
      ['media_player', 0x0183],
      ['media_play_pause', 0x00cd],
      ['media_next', 0x00b5],
      ['media_prev', 0x00b6],
      ['media_stop', 0x00b7],
      ['media_mute', 0x00e2],
      ['media_vol_up', 0x00e9],
      ['media_vol_down', 0x00ea],
      ['media_email', 0x018a],
      ['media_calc', 0x0192],
      ['media_computer', 0x0194],
      ['media_home', 0x0223],
      ['media_search', 0x0221],
      ['media_web_forward', 0x0225],
      ['media_web_back', 0x0224],
      ['media_web_stop', 0x0226],
      ['media_refresh', 0x0227],
      ['media_favorites', 0x022a],
    ] as const
  ).map(
    ([id, usage]) =>
      ({
        id,
        labelKey: id,
        group: 'media' as const,
        type: 0x05,
        param1: 0,
        param2: 0,
        mediaUsage: [usage & 0xff, (usage >> 8) & 0xff] as [number, number],
      }) satisfies KingActionDef,
  ),
  // Lighting — King XML SubKeyFunction type 08 (no “all toggle”)
  {
    id: 'led_strip_toggle',
    labelKey: 'led_strip_toggle',
    group: 'lighting',
    type: 0x08,
    ...v(0x0003),
  },
  {
    id: 'led_effect_loop',
    labelKey: 'led_effect_loop',
    group: 'lighting',
    type: 0x08,
    ...v(0x0004),
  },
]

const BY_ID = new Map(KING_ULTRA_BUTTON_ACTIONS.map((a) => [a.id, a]))

export function getKingAction(id: ButtonAction): KingActionDef | undefined {
  return BY_ID.get(id)
}

export function actionToKeyFun(action: ButtonAction): {
  type: number
  param1: number
  param2: number
} {
  const def = BY_ID.get(action)
  if (!def) return { type: 0, param1: 0, param2: 0 }
  return { type: def.type, param1: def.param1, param2: def.param2 }
}

export function keyFunToAction(
  type: number,
  param1: number,
  param2: number,
): ButtonAction {
  if (type === 6) return 'macro'
  if (type === 4) return 'fire'
  if (type === 5 && param1 === 0 && param2 === 0) return 'combo'
  for (const a of KING_ULTRA_BUTTON_ACTIONS) {
    if (a.id === 'macro' || a.id === 'fire' || a.mediaUsage) continue
    if (a.type === type && a.param1 === param1 && a.param2 === param2) return a.id
  }
  if (type === 0) return 'disabled'
  return 'disabled'
}

/** King ShortCutKey flash (OEM FlashDataMap.shortCutKey) — independent of Blitz copy. */
export const SHORTCUT_FLASH_BASE = 0x100
export const SHORTCUT_FLASH_STRIDE = 0x20

export function shortcutFlashAddress(flashIndex: number): number {
  return SHORTCUT_FLASH_BASE + (flashIndex & 0x0f) * SHORTCUT_FLASH_STRIDE
}

export function encodeMediaShortcutFlash(
  usageLo: number,
  usageHi: number,
): { buffer: Uint8Array; writeLen: number } {
  const buf = new Uint8Array(SHORTCUT_FLASH_STRIDE)
  buf.fill(0xff)
  const events: number[][] = [
    [0x80 | 2, usageLo & 0xff, usageHi & 0xff],
    [0x40 | 2, usageLo & 0xff, usageHi & 0xff],
  ]
  buf[0] = events.length
  let off = 1
  for (const ev of events) {
    buf[off++] = ev[0]!
    buf[off++] = ev[1]!
    buf[off++] = ev[2]!
  }
  const bodyEnd = off
  buf[bodyEnd] = protocolChecksum(buf, 0, bodyEnd)
  return { buffer: buf, writeLen: bodyEnd + 1 }
}

export function encodeMediaShortcutWrite(
  flashIndex: number,
  usageLo: number,
  usageHi: number,
): EncodedReport[] {
  const { buffer, writeLen } = encodeMediaShortcutFlash(usageLo, usageHi)
  return encodeWriteFlashChunks(shortcutFlashAddress(flashIndex), buffer, writeLen)
}

export function encodeClearShortcutWrite(flashIndex: number): EncodedReport[] {
  const buf = new Uint8Array(SHORTCUT_FLASH_STRIDE)
  buf.fill(0xff)
  buf[0] = 0
  buf[1] = protocolChecksum(buf, 0, 1)
  return encodeWriteFlashChunks(shortcutFlashAddress(flashIndex), buf, 2)
}
