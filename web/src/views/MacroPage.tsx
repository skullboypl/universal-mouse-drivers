'use client'

import { ClientRedirect } from '../components/ClientRedirect'
import { useLocale } from '../i18n/LocaleContext'

/** Macro tab is hidden for Blitz / King Ultra. */
export function MacroPage() {
  const { lp } = useLocale()
  return <ClientRedirect href={lp('/device/buttons')} />
}
