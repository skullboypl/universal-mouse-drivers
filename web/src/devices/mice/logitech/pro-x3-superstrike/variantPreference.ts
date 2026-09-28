import type { X3Variant } from './protocol'

const KEY = 'umd:x3-case-variant'

/**
 * X3 does not report case color over HID++. When the device identity read
 * can't resolve a confirmed variant, the user picks one manually and it is
 * remembered locally (per browser) so the correct product photo keeps
 * showing on reconnect - this is a UI fallback, never a device write.
 */
export function loadVariantPreference(): Exclude<X3Variant, 'unknown'> | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw === 'midnight-black' || raw === 'magenta-eclipse' ? raw : null
  } catch {
    return null
  }
}

export function saveVariantPreference(
  variant: Exclude<X3Variant, 'unknown'>,
): void {
  try {
    localStorage.setItem(KEY, variant)
  } catch {
    /* ignore */
  }
}
