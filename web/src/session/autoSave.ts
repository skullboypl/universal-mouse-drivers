import type { DeviceState } from '../devices/types'

export function draftStorageKey(deviceId: string): string {
  return `webdriver:${deviceId}:autosave`
}

export function loadSavedDraft(
  deviceId: string,
): Partial<DeviceState> | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(deviceId))
    if (!raw) return null
    return JSON.parse(raw) as Partial<DeviceState>
  } catch {
    return null
  }
}

export function persistDraft(deviceId: string, state: DeviceState): void {
  const payload = {
    profileIndex: state.profileIndex,
    buttons: state.buttons,
    sensor: state.sensor,
    macros: state.macros,
    settings: state.settings,
    savedAt: new Date().toISOString(),
  }
  localStorage.setItem(draftStorageKey(deviceId), JSON.stringify(payload))
}
