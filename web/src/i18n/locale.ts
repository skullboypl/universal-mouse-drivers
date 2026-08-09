export type Locale = 'pl' | 'en'

export const LOCALES: Locale[] = ['pl', 'en']

export const LOCALE_LABELS: Record<Locale, string> = {
  pl: 'PL',
  en: 'EN',
}

export const LOCALE_STORAGE_KEY = 'umd-locale'

/** Map legacy draft values (`English` / `Polski`) and BCP-47 → `pl` | `en`. */
export function normalizeLocale(raw: string | null | undefined): Locale | null {
  if (raw == null || raw === '') return null
  const s = raw.trim().toLowerCase()
  if (s === 'pl' || s === 'polski' || s.startsWith('pl-') || s.startsWith('pl_')) {
    return 'pl'
  }
  if (
    s === 'en' ||
    s === 'english' ||
    s.startsWith('en-') ||
    s.startsWith('en_')
  ) {
    return 'en'
  }
  return null
}

export function readStoredLocale(): Locale | null {
  try {
    return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
  } catch {
    return null
  }
}

export function writeStoredLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
}

export function localeFromNavigator(): Locale {
  const nav =
    typeof navigator !== 'undefined'
      ? (navigator.languages?.[0] ?? navigator.language ?? '')
      : ''
  return normalizeLocale(nav) ?? 'en'
}

/** Country → locale. Poland → pl, everything else → en. */
export async function detectLocaleFromIp(): Promise<Locale> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return localeFromNavigator()
    const data = (await res.json()) as { country_code?: string }
    if ((data.country_code ?? '').toUpperCase() === 'PL') return 'pl'
    return 'en'
  } catch {
    return localeFromNavigator()
  }
}

export function isLocale(value: string | undefined): value is Locale {
  return value === 'pl' || value === 'en'
}

/** Prefix a path with `/{locale}` (`/device/sensor` → `/pl/device/sensor`). */
export function withLocale(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (clean === '/') return `/${locale}`
  return `/${locale}${clean}`
}

/** Strip leading `/{pl|en}` from a pathname. */
export function stripLocalePrefix(pathname: string): string {
  const m = pathname.match(/^\/(pl|en)(\/.*)?$/)
  if (!m) return pathname || '/'
  return m[2] && m[2].length > 0 ? m[2] : '/'
}
