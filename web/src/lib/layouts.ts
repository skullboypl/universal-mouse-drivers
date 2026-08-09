/** Client-safe layout metadata (no node:fs). */

export interface ButtonPosition {
  id: number
  uiX: number
  uiY: number
}

/** Buttons page arts + Connect hero art. */
export type LayoutId = 'king-ultra' | 'king-ultra-hero' | 'umd-demo'

export const LAYOUT_IDS: LayoutId[] = [
  'king-ultra',
  'king-ultra-hero',
  'umd-demo',
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
  'umd-demo': {
    label: 'Demo mouse (devices/demo/mouse.png)',
    imageUrl: '/devices/demo/mouse.png',
    width: 1536,
    height: 1024,
  },
}

export function parseLayoutId(raw: unknown): LayoutId {
  if (raw === 'king-ultra-hero') return 'king-ultra-hero'
  if (raw === 'umd-demo') return 'umd-demo'
  return 'king-ultra'
}
