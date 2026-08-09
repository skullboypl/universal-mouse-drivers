import fs from 'node:fs'
import path from 'node:path'
import { AdminButtonsEditor } from '@/components/admin/AdminButtonsEditor'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton'
import { getAdminSession } from '@/lib/auth'
import { bundledDownloadsDir, downloadsDir, resolveDownloadFile } from '@/lib/paths'
import { getButtonLayout, getDownloadMeta } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getAdminSession()
  if (!user) {
    return (
      <>
        <h1 className="page-title">UMD Admin</h1>
        <p className="page-sub">
          Zaloguj się, żeby ustawiać pozycje przycisków 1–6 (Buttons + Hero).
        </p>
        <AdminLoginForm />
      </>
    )
  }

  const buttonsLayout = getButtonLayout('king-ultra')
  const heroLayout = getButtonLayout('king-ultra-hero')
  const tray = getDownloadMeta('trayBattery')
  const trayResolved = tray ? resolveDownloadFile(tray.filename) : null
  const trayPresent = Boolean(trayResolved)
  const traySource = trayResolved
    ? trayResolved.startsWith(bundledDownloadsDir())
      ? 'bundled (image)'
      : 'persistent /app/data/downloads'
    : 'missing'

  return (
    <>
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <div>
          <h1 className="page-title">UMD Admin</h1>
          <p className="page-sub">Zalogowano jako {user}</p>
        </div>
        <AdminLogoutButton />
      </header>

      <section className="panel" style={{ marginBottom: 16 }}>
        <h2 className="panel-label">Tray Battery (.exe)</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Źródło: <code className="mono">{traySource}</code>
          <br />
          Override (opcjonalnie):{' '}
          <code className="mono">
            {downloadsDir()}/{tray?.filename}
          </code>
        </p>
        <p className="mono">
          status:{' '}
          {trayPresent
            ? 'OK - dostępny do pobrania'
            : 'BRAK - brak w bundled-downloads i persistent'}
          {tray?.signed ? ' · EV signed' : ' · unsigned'}
          {tray?.version ? ` · v${tray.version}` : ''}
        </p>
        <p style={{ marginBottom: 0 }}>
          Public URL:{' '}
          <a href={`/api/downloads/${tray?.filename ?? 'UmdBatteryTray.exe'}`}>
            /api/downloads/{tray?.filename ?? 'UmdBatteryTray.exe'}
          </a>
        </p>
      </section>

      <AdminButtonsEditor layoutId="king-ultra" initial={buttonsLayout} />
      <AdminButtonsEditor layoutId="king-ultra-hero" initial={heroLayout} />
    </>
  )
}
