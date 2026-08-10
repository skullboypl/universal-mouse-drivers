/** OEM Fenrir Parameter Settings → Sleep Time (seconds slider). */
export const FENRIR_SLEEP_MIN_SEC = 30
export const FENRIR_SLEEP_MAX_SEC = 600
export const FENRIR_SLEEP_STEP_SEC = 5
/** Soft default when device has not reported yet (1 min). */
export const FENRIR_SLEEP_DEFAULT_SEC = 60

export function clampFenrirSleepSec(sec: number): number {
  const stepped =
    Math.round(sec / FENRIR_SLEEP_STEP_SEC) * FENRIR_SLEEP_STEP_SEC
  return Math.min(
    FENRIR_SLEEP_MAX_SEC,
    Math.max(FENRIR_SLEEP_MIN_SEC, stepped),
  )
}

export function resolveFenrirSleepSec(settings: {
  sleepAfterSec?: number
  sleepAfterMin?: number
}): number {
  if (settings.sleepAfterSec != null) {
    return clampFenrirSleepSec(settings.sleepAfterSec)
  }
  if (settings.sleepAfterMin != null) {
    return clampFenrirSleepSec(settings.sleepAfterMin * 60)
  }
  return FENRIR_SLEEP_DEFAULT_SEC
}

/** Same readout style as OEM live label (Ns / N min). */
export function formatFenrirSleep(sec: number): string {
  const s = clampFenrirSleepSec(sec)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r === 0 ? `${m} min` : `${m} min ${r}s`
}
