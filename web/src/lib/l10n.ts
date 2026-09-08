import { LOCALES, type Locale } from '@/i18n/locale'

/** Partial locale map with required English fallback (SEO / long copy). */
export type L10nString = Partial<Record<Locale, string>> & { en: string }

/** Partial locale map of string lists with required English fallback. */
export type L10nList = Partial<Record<Locale, string[]>> & { en: string[] }

export function L(map: L10nString, locale: Locale): string {
  return map[locale] ?? map.en
}

export function Llist(map: L10nList, locale: Locale): string[] {
  return map[locale] ?? map.en
}

/** Expand a partial map to every Locale (fills gaps from `en`). */
export function expandL10n(map: L10nString): Record<Locale, string> {
  const out = {} as Record<Locale, string>
  for (const loc of LOCALES) {
    out[loc] = map[loc] ?? map.en
  }
  return out
}

export const OG_LOCALE_TAG: Record<Locale, string> = {
  pl: 'pl_PL',
  en: 'en_US',
  de: 'de_DE',
  fr: 'fr_FR',
  es: 'es_ES',
  pt: 'pt_PT',
  it: 'it_IT',
  zh: 'zh_CN',
  ja: 'ja_JP',
  ko: 'ko_KR',
  ru: 'ru_RU',
}
