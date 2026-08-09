/** Client-safe layout metadata (no node:fs). */

export interface ButtonPosition {
  id: number
  uiX: number
  uiY: number
}

/** Buttons page OEM art + Connect hero art. */
export type LayoutId = 'king-ultra' | 'king-ultra-hero'

export const LAYOUT_META: Record<
  LayoutId,
  { label: string; imageUrl: string; width: number; height: number }
> = {
  'king-ultra': {
    label: 'Przyciski (OEM mouse.png)',
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
}
