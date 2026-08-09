'use client'

import { ClientRedirect } from '../components/ClientRedirect'
import { useLocale } from '../i18n/LocaleContext'
import { useT } from '../i18n/useT'
import { useDeviceSession } from '../session/DeviceSessionContext'

/** Macro editor is intentionally gated until HID macro write path is ready. */
export function MacroPage() {
  const { connected } = useDeviceSession()
  const { lp } = useLocale()
  const tr = useT()

  if (!connected) return <ClientRedirect href={lp('/')} />

  return (
    <div className="page">
      <h1 className="page-title">{tr('macro.title')}</h1>
      <p className="page-sub">{tr('macro.comingSoon')}</p>
      <div className="panel">
        <p className="muted" style={{ margin: 0 }}>
          {tr('macro.comingSoonBody')}
        </p>
      </div>
    </div>
  )
}
