'use client'

import { t, type MessageKey, type MessageVars } from './messages'
import { useLocaleOptional } from './LocaleContext'
import { readStoredLocale } from './locale'
import { useDeviceSession } from '../session/DeviceSessionContext'
import { normalizeLocale } from './locale'

export function useT() {
  const localeCtx = useLocaleOptional()
  const { state } = useDeviceSession()
  const locale =
    localeCtx?.locale ??
    normalizeLocale(state?.settings.language) ??
    readStoredLocale() ??
    'pl'

  return (key: MessageKey, vars?: MessageVars) => t(locale, key, vars)
}
