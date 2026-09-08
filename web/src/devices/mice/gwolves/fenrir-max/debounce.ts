/** OEM Fenir Max ButtonDebounceLevel from env-models.json
 *  Index → beforePress, beforeRelease, afterPress, afterRelease
 *  0: 2/5/35/10 · 1: 3/10/35/20 · 2: 3/15/40/20
 *  3: 4/20/40/30 · 4: 4/25/40/30 · 5: 5/25/45/30
 */
export const FENRIR_CLICK_DEBOUNCE_LEVELS = [
  { select: 2, data: [5, 35, 10] as const },
  { select: 3, data: [10, 35, 20] as const },
  { select: 3, data: [15, 40, 20] as const },
  { select: 4, data: [20, 40, 30] as const },
  { select: 4, data: [25, 40, 30] as const },
  { select: 5, data: [25, 45, 30] as const },
] as const

/** OEM wheel debounce preset levels (ms) - same order as mouse.xyz.
 *  L1=8 · L2=20 · L3=15 · L4=30
 */
export const FENRIR_WHEEL_DEBOUNCE_PRESETS = [8, 20, 15, 30] as const

/** OEM ButtonDebounceTimeMax (Fenir Max env-models) - 50, not 30. */
export const FENRIR_CLICK_DEBOUNCE_MAX = 50
/** OEM WheelDebounceTimeMax (Fenir Max env-models) - 500. */
export const FENRIR_WHEEL_DEBOUNCE_MAX = 500

export type FenrirClickDebounceQuad = {
  beforePress: number
  beforeRelease: number
  afterPress: number
  afterRelease: number
}

export function fenrirClickLevelIndex(
  before: number,
  release: number,
  afterPress: number,
  afterRelease: number,
): number {
  return FENRIR_CLICK_DEBOUNCE_LEVELS.findIndex(
    (l) =>
      l.select === before &&
      l.data[0] === release &&
      l.data[1] === afterPress &&
      l.data[2] === afterRelease,
  )
}

export function fenrirClickQuadFromLevel(level: number): FenrirClickDebounceQuad {
  const idx = Math.max(
    0,
    Math.min(FENRIR_CLICK_DEBOUNCE_LEVELS.length - 1, level),
  )
  const preset = FENRIR_CLICK_DEBOUNCE_LEVELS[idx]!
  return {
    beforePress: preset.select,
    beforeRelease: preset.data[0],
    afterPress: preset.data[1],
    afterRelease: preset.data[2],
  }
}

export function fenrirWheelLevelIndex(ms: number): number {
  return FENRIR_WHEEL_DEBOUNCE_PRESETS.findIndex((v) => v === ms)
}
