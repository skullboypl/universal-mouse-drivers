/**
 * Dynamic Sensitivity curve presets from Synapse product 229 UI
 * (`main.3e19820b.js` — `sI` / Classic=0, Natural=1, Jump=2, Custom=3).
 * X ≈ mouse speed (0…100), Y ≈ sensitivity multiplier.
 */

import type { ViperV4DynModeId } from './protocol'

export type DynSensPoint = { x: number; y: number }

export type DynSensCurvePreset = {
  id: Exclude<ViperV4DynModeId, 'off'>
  gapX: number
  gapY: number
  startY: number
  pointList: DynSensPoint[]
  label: string
  labelPl: string
  blurb: string
  blurbPl: string
}

export const VIPER_V4_DYN_SENS_CURVES: Record<
  Exclude<ViperV4DynModeId, 'off'>,
  DynSensCurvePreset
> = {
  classic: {
    id: 'classic',
    gapX: 10,
    gapY: 0.1,
    startY: 1,
    pointList: [
      { x: 0, y: 1 },
      { x: 20, y: 1.1 },
      { x: 40, y: 1.2 },
      { x: 70, y: 1.35 },
      { x: 100, y: 1.5 },
    ],
    label: 'Classic',
    labelPl: 'Classic',
    blurb: 'Smooth ramp — sensitivity rises steadily as you flick faster.',
    blurbPl: 'Płynny narost — czułość rośnie stopniowo przy szybszych ruchach.',
  },
  natural: {
    id: 'natural',
    gapX: 10,
    gapY: 0.1,
    startY: 1,
    pointList: [
      { x: 0, y: 1 },
      { x: 11, y: 1.45 },
      { x: 20, y: 1.5 },
      { x: 35, y: 1.5 },
      { x: 100, y: 1.5 },
    ],
    label: 'Natural',
    labelPl: 'Natural',
    blurb: 'Quick lift early — aim stays precise at low speed, then plateaus.',
    blurbPl: 'Szybki skok na starcie — precyzja przy wolnych ruchach, potem plateau.',
  },
  jump: {
    id: 'jump',
    gapX: 10,
    gapY: 0.1,
    startY: 1,
    pointList: [
      { x: 0, y: 1 },
      { x: 9, y: 1 },
      { x: 21, y: 1.5 },
      { x: 24, y: 1.5 },
      { x: 100, y: 1.5 },
    ],
    label: 'Jump',
    labelPl: 'Jump',
    blurb: 'Step curve — 1× until a threshold, then snaps to 1.5× for flicks.',
    blurbPl: 'Krzywa schodkowa — 1× do progu, potem skok do 1.5× przy flickach.',
  },
  custom: {
    id: 'custom',
    gapX: 15,
    gapY: 0.25,
    startY: 0,
    // Editable control points in UI; 0b/13 250-point device write is separate.
    pointList: [
      { x: 0, y: 1 },
      { x: 25, y: 1.15 },
      { x: 50, y: 1.3 },
      { x: 75, y: 1.4 },
      { x: 100, y: 1.5 },
    ],
    label: 'Custom',
    labelPl: 'Custom',
    blurb: 'Drag control points to shape the curve. Live marker follows mouse speed.',
    blurbPl: 'Przeciągnij punkty, żeby ukształtować krzywą. Marker śledzi prędkość myszy.',
  },
}

/** Piecewise-linear sample of Synapse control points. */
export function sampleDynSensCurve(
  points: DynSensPoint[],
  x: number,
): number {
  if (points.length === 0) return 1
  const clamped = Math.max(0, Math.min(100, x))
  if (clamped <= (points[0]?.x ?? 0)) return points[0]?.y ?? 1
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!
    const b = points[i]!
    if (clamped <= b.x) {
      const t = (clamped - a.x) / Math.max(1e-6, b.x - a.x)
      return a.y + (b.y - a.y) * t
    }
  }
  return points[points.length - 1]?.y ?? 1
}
