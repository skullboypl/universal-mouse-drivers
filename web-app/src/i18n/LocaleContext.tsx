import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { useDeviceSession } from '../session/DeviceSessionContext'
import {
  detectLocaleFromIp,
  isLocale,
  readStoredLocale,
  stripLocalePrefix,
  withLocale,
  writeStoredLocale,
  type Locale,
} from './locale'

interface LocaleValue {
  locale: Locale
  setLocale: (next: Locale) => void
  lp: (path: string) => string
}

const LocaleContext = createContext<LocaleValue | null>(null)

export function useLocale(): LocaleValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used under LocaleRoute')
  }
  return ctx
}

/** Safe hook when outside locale routes (e.g. redirect screen). */
export function useLocaleOptional(): LocaleValue | null {
  return useContext(LocaleContext)
}

export function LocaleRedirect() {
  const stored = readStoredLocale()
  if (stored) {
    return <Navigate to={`/${stored}`} replace />
  }
  return <IpLocaleGate />
}

function IpLocaleGate() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const locale = await detectLocaleFromIp()
      if (cancelled) return
      writeStoredLocale(locale)
      navigate(`/${locale}`, { replace: true })
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="page" style={{ padding: 48, textAlign: 'center' }}>
      <p className="muted" style={{ margin: 0 }}>
        UMD…
      </p>
    </div>
  )
}

/** Validates `/:lang` and provides locale + path helper. */
export function LocaleRoute() {
  const { lang } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { connected, apply, state } = useDeviceSession()
  const valid = isLocale(lang)
  const locale: Locale = valid ? lang : (readStoredLocale() ?? 'pl')

  const setLocale = useCallback(
    (next: Locale) => {
      writeStoredLocale(next)
      document.documentElement.lang = next
      if (connected) {
        void apply((d) => d.patchSettings({ language: next }))
      }
      const rest = stripLocalePrefix(location.pathname)
      navigate(withLocale(next, rest), { replace: true })
    },
    [connected, apply, location.pathname, navigate],
  )

  const lp = useCallback(
    (path: string) => withLocale(locale, path),
    [locale],
  )

  useEffect(() => {
    if (!valid) return
    document.documentElement.lang = locale
    writeStoredLocale(locale)
  }, [valid, locale])

  useEffect(() => {
    if (!valid || !connected || !state) return
    if (state.settings.language === locale) return
    void apply((d) => d.patchSettings({ language: locale }))
  }, [valid, connected, state, locale, apply])

  const value = useMemo(
    () => ({ locale, setLocale, lp }),
    [locale, setLocale, lp],
  )

  if (!valid) {
    const rest = stripLocalePrefix(location.pathname)
    return (
      <Navigate to={withLocale(locale, rest === '/' ? '/' : rest)} replace />
    )
  }

  return (
    <LocaleContext.Provider value={value}>
      <Outlet />
    </LocaleContext.Provider>
  )
}

export function LangHomeRedirect() {
  const { lp } = useLocale()
  return <Navigate to={lp('/')} replace />
}
