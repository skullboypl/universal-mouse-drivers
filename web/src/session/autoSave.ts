import type { DeviceState } from '../devices/types'
import { KING_ULTRA_IDENTITY } from '../devices/redragon-king-ultra/identity'

const STORAGE_KEY = `webdriver:${KING_ULTRA_IDENTITY.id}:autosave`

export function loadSavedDraft(): Partial<DeviceState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<DeviceState>
  } catch {
    return null
  }
}

export function persistDraft(state: DeviceState): void {
  const payload = {
    profileIndex: state.profileIndex,
    buttons: state.buttons,
    sensor: state.sensor,
    macros: state.macros,
    settings: state.settings,
    savedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
