/** Supported UI / URL locales for UMD. */
export type Locale =
  | 'pl'
  | 'en'
  | 'de'
  | 'fr'
  | 'es'
  | 'pt'
  | 'it'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ru'

export const LOCALES: Locale[] = [
  'pl',
  'en',
  'de',
  'fr',
  'es',
  'pt',
  'it',
  'zh',
  'ja',
  'ko',
  'ru',
]

/** Short codes for compact UI (legacy). Prefer LOCALE_NATIVE_NAMES. */
export const LOCALE_LABELS: Record<Locale, string> = {
  pl: 'PL',
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  pt: 'PT',
  it: 'IT',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ru: 'RU',
}

/** Native endonym shown in the language dropdown. */
export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  pl: 'Polski',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ru: 'Русский',
}

/** BCP-47 / HTML lang attribute (zh → zh-CN). */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  pl: 'pl',
  en: 'en',
  de: 'de',
  fr: 'fr',
  es: 'es',
  pt: 'pt',
  it: 'it',
  zh: 'zh-CN',
  ja: 'ja',
  ko: 'ko',
  ru: 'ru',
}

export const LOCALE_STORAGE_KEY = 'umd-locale'

const LOCALE_SET = new Set<string>(LOCALES)

/** ISO 3166-1 alpha-2 → preferred UMD locale. */
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  PL: 'pl',
  DE: 'de',
  AT: 'de',
  LI: 'de',
  CH: 'de',
  FR: 'fr',
  MC: 'fr',
  LU: 'fr',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  VE: 'es',
  EC: 'es',
  GT: 'es',
  CU: 'es',
  DO: 'es',
  HN: 'es',
  PY: 'es',
  SV: 'es',
  NI: 'es',
  CR: 'es',
  PA: 'es',
  UY: 'es',
  BO: 'es',
  PT: 'pt',
  BR: 'pt',
  AO: 'pt',
  MZ: 'pt',
  IT: 'it',
  SM: 'it',
  VA: 'it',
  CN: 'zh',
  TW: 'zh',
  HK: 'zh',
  MO: 'zh',
  SG: 'zh',
  JP: 'ja',
  KR: 'ko',
  RU: 'ru',
  BY: 'ru',
  KZ: 'ru',
  KG: 'ru',
  US: 'en',
  GB: 'en',
  AU: 'en',
  NZ: 'en',
  IE: 'en',
  CA: 'en',
  IN: 'en',
  PH: 'en',
  ZA: 'en',
  NG: 'en',
  KE: 'en',
  BE: 'fr',
}

export function localeFromCountryCode(
  country: string | null | undefined,
): Locale | null {
  if (!country) return null
  const code = country.trim().toUpperCase()
  if (!code || code === 'XX' || code === 'T1') return null
  return COUNTRY_TO_LOCALE[code] ?? null
}

/** Map cookie / device / BCP-47 tags → Locale. */
export function normalizeLocale(raw: string | null | undefined): Locale | null {
  if (raw == null || raw === '') return null
  const s = raw.trim().toLowerCase().replace(/_/g, '-')
  if (LOCALE_SET.has(s)) return s as Locale

  const primary = s.split('-')[0] ?? ''
  if (LOCALE_SET.has(primary)) return primary as Locale

  // Legacy / endonyms
  if (s === 'polski' || primary === 'pl') return 'pl'
  if (s === 'english' || primary === 'en') return 'en'
  if (s === 'deutsch' || primary === 'de') return 'de'
  if (s === 'francais' || s === 'français' || primary === 'fr') return 'fr'
  if (s === 'espanol' || s === 'español' || primary === 'es') return 'es'
  if (s === 'portugues' || s === 'português' || primary === 'pt') return 'pt'
  if (s === 'italiano' || primary === 'it') return 'it'
  if (primary === 'zh' || s.startsWith('zh-')) return 'zh'
  if (primary === 'ja' || s.startsWith('jp')) return 'ja'
  if (primary === 'ko') return 'ko'
  if (primary === 'ru') return 'ru'

  return null
}

/** Parse Accept-Language into best matching Locale (q-aware). */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return 'en'
  const parts = header.split(',').map((part) => {
    const [tag, ...params] = part.trim().split(';')
    let q = 1
    for (const p of params) {
      const m = p.trim().match(/^q=([0-9.]+)$/i)
      if (m) q = Number(m[1]) || 0
    }
    return { tag: (tag ?? '').trim().toLowerCase(), q }
  })
  parts.sort((a, b) => b.q - a.q)
  for (const { tag } of parts) {
    const hit = normalizeLocale(tag)
    if (hit) return hit
  }
  return 'en'
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

/** Client helper: country via ipapi → locale (cookie / URL still win in app). */
export async function detectLocaleFromIp(): Promise<Locale> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return localeFromNavigator()
    const data = (await res.json()) as { country_code?: string }
    return localeFromCountryCode(data.country_code) ?? localeFromNavigator()
  } catch {
    return localeFromNavigator()
  }
}

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && LOCALE_SET.has(value)
}

/** Prefix a path with `/{locale}` (`/device/sensor` → `/pl/device/sensor`). */
export function withLocale(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (clean === '/') return `/${locale}`
  return `/${locale}${clean}`
}

const LOCALE_PATH_RE = new RegExp(
  `^/(${LOCALES.join('|')})(/.*)?$`,
)

/** Strip leading `/{locale}` from a pathname. */
export function stripLocalePrefix(pathname: string): string {
  const m = pathname.match(LOCALE_PATH_RE)
  if (!m) return pathname || '/'
  return m[2] && m[2].length > 0 ? m[2] : '/'
}
