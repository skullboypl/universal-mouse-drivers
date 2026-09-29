import { OPENMOUSE_CATALOG, type OpenMouseCatalogEntry } from './catalog.generated'
import { OPENMOUSE_HUB_PATH, openMouseBrandPath } from './catalog'
import type { Locale } from '@/i18n/locale'

export const OPENMOUSE_PAGE_SIZE = 24

const PAGE_WORD: Record<Locale, string> = {
  pl: 'Strona', en: 'Page', de: 'Seite', fr: 'Page', es: 'Página',
  pt: 'Página', it: 'Pagina', zh: '第', ja: 'ページ', ko: '페이지', ru: 'Страница',
}

export const OPENMOUSE_PAGINATION_COPY: Record<Locale, { previous: string; next: string; navigation: string }> = {
  pl: { previous: 'Poprzednia', next: 'Następna', navigation: 'Strony katalogu' },
  en: { previous: 'Previous', next: 'Next', navigation: 'Catalog pages' },
  de: { previous: 'Zurück', next: 'Weiter', navigation: 'Katalogseiten' },
  fr: { previous: 'Précédente', next: 'Suivante', navigation: 'Pages du catalogue' },
  es: { previous: 'Anterior', next: 'Siguiente', navigation: 'Páginas del catálogo' },
  pt: { previous: 'Anterior', next: 'Seguinte', navigation: 'Páginas do catálogo' },
  it: { previous: 'Precedente', next: 'Successiva', navigation: 'Pagine del catalogo' },
  zh: { previous: '上一页', next: '下一页', navigation: '目录分页' },
  ja: { previous: '前へ', next: '次へ', navigation: 'カタログのページ' },
  ko: { previous: '이전', next: '다음', navigation: '카탈로그 페이지' },
  ru: { previous: 'Назад', next: 'Далее', navigation: 'Страницы каталога' },
}

export function openMousePageLabel(lang: Locale, page: number): string {
  return lang === 'zh' ? `第 ${page} 页` : `${PAGE_WORD[lang]} ${page}`
}

export function openMousePageNumber(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null
  const page = Number(value)
  return Number.isSafeInteger(page) ? page : null
}

export function openMousePagePath(page: number, brandSlug?: string): string {
  const base = brandSlug ? openMouseBrandPath(brandSlug) : OPENMOUSE_HUB_PATH
  return page === 1 ? base : `${base}/page/${page}`
}

export function openMousePageCount(total: number): number {
  return Math.max(1, Math.ceil(total / OPENMOUSE_PAGE_SIZE))
}

export function openMouseCatalogPage(page: number, brandSlug?: string): {
  entries: OpenMouseCatalogEntry[]
  total: number
  pageCount: number
} {
  const all = brandSlug
    ? OPENMOUSE_CATALOG.filter((entry) => entry.brandSlug === brandSlug)
    : OPENMOUSE_CATALOG
  const total = all.length
  const pageCount = openMousePageCount(total)
  return {
    entries: page >= 1 && page <= pageCount
      ? all.slice((page - 1) * OPENMOUSE_PAGE_SIZE, page * OPENMOUSE_PAGE_SIZE)
      : [],
    total,
    pageCount,
  }
}
