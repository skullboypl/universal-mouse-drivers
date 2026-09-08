import { FENRIR_MAX_ART } from '@/devices/mice/gwolves/fenrir-max/buttons'
import { BLITZ_MOUSE_ART } from '@/devices/mice/rampage/blitz-ultimate/buttons'

/** Client-safe layout metadata (no node:fs). */

export interface ButtonPosition {
  id: number
  uiX: number
  uiY: number
}

/** Buttons page arts + Connect hero art. */
export type LayoutId =
  | 'king-ultra'
  | 'king-ultra-hero'
  | 'blitz-ultimate'
  | 'umd-demo'
  | 'fenrir-max'

export const LAYOUT_IDS: LayoutId[] = [
  'king-ultra',
  'king-ultra-hero',
  'blitz-ultimate',
  'umd-demo',
  'fenrir-max',
]

export const LAYOUT_META: Record<
  LayoutId,
  { label: string; imageUrl: string; width: number; height: number }
> = {
  'king-ultra': {
    label: 'Przyciski King Ultra (OEM mouse.png)',
    imageUrl: '/devices/king-ultra/mouse.png',
    width: 432,
    height: 356,
  },
  'king-ultra-hero': {
    label: 'Hero connect (mouse-hero.png)',
    imageUrl: '/brand/mouse-hero.png',
    width: 1200,
    height: 1521,
  },
  'blitz-ultimate': {
    label: 'Przyciski Blitz Ultimate (OEM mouse.png)',
    imageUrl: '/devices/blitz-ultimate/mouse.png',
    width: BLITZ_MOUSE_ART.width,
    height: BLITZ_MOUSE_ART.height,
  },
  'umd-demo': {
    label: 'Demo mouse (devices/mice/demo/mouse.png)',
    imageUrl: '/devices/demo/mouse.png',
    width: 1536,
    height: 1024,
  },
  'fenrir-max': {
    label: 'G-Wolves Fenrir Max 8K (OEM Fenir/Device.png)',
    imageUrl: '/devices/fenrir-max/mouse.png',
    width: FENRIR_MAX_ART.width,
    height: FENRIR_MAX_ART.height,
  },
}

export function parseLayoutId(raw: unknown): LayoutId {
  if (raw === 'king-ultra-hero') return 'king-ultra-hero'
  if (raw === 'blitz-ultimate') return 'blitz-ultimate'
  if (raw === 'umd-demo') return 'umd-demo'
  if (raw === 'fenrir-max') return 'fenrir-max'
  return 'king-ultra'
}
