'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import {
  isLocale,
  LOCALE_HTML_LANG,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  stripLocalePrefix,
  withLocale,
  writeStoredLocale,
  type Locale,
} from './locale'

function writeLocaleCookie(locale: Locale) {
  try {
    document.cookie = `${LOCALE_STORAGE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`
  } catch {
    /* ignore */
  }
}

interface LocaleValue {
  locale: Locale
  setLocale: (next: Locale) => void
  lp: (path: string) => string
}

const LocaleContext = createContext<LocaleValue | null>(null)

export function useLocale(): LocaleValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used under LocaleProvider')
  }
  return ctx
}

export function useLocaleOptional(): LocaleValue | null {
  return useContext(LocaleContext)
}

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const { connected, apply, state } = useDeviceSession()

  const setLocale = useCallback(
    (next: Locale) => {
      writeStoredLocale(next)
      writeLocaleCookie(next)
      document.documentElement.lang = LOCALE_HTML_LANG[next]
      if (connected) {
        void apply((d) => d.patchSettings({ language: next }))
      }
      const rest = stripLocalePrefix(pathname)
      router.replace(withLocale(next, rest))
    },
    [connected, apply, pathname, router],
  )

  const lp = useCallback(
    (path: string) => withLocale(locale, path),
    [locale],
  )

  useEffect(() => {
    document.documentElement.lang = LOCALE_HTML_LANG[locale]
    writeStoredLocale(locale)
    writeLocaleCookie(locale)
  }, [locale])

  useEffect(() => {
    if (!connected || !state) return
    if (state.settings.language === locale) return
    void apply((d) => d.patchSettings({ language: locale }))
  }, [connected, state, locale, apply])

  const value = useMemo(
    () => ({ locale, setLocale, lp }),
    [locale, setLocale, lp],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

/** Client gate used only if URL lang is wrong - prefer server redirect. */
export function useLangParam(): Locale {
  const params = useParams()
  const lang = params?.lang
  if (typeof lang === 'string' && isLocale(lang)) return lang
  return readStoredLocale() ?? 'pl'
}
