import fs from 'node:fs'
import path from 'node:path'
import { AdminButtonsEditor } from '@/components/admin/AdminButtonsEditor'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton'
import { getAdminSession } from '@/lib/auth'
import { downloadsDir } from '@/lib/paths'
import { getButtonLayout, getDownloadMeta } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getAdminSession()
  if (!user) {
    return (
      <>
        <h1 className="page-title">UMD Admin</h1>
        <p className="page-sub">
          Zaloguj się, żeby ustawiać pozycje przycisków 1–6.
        </p>
        <AdminLoginForm />
      </>
    )
  }

  const positions = getButtonLayout('king-ultra')
  const tray = getDownloadMeta('trayBattery')
  const trayPath = tray ? path.join(downloadsDir(), tray.filename) : null
  const trayPresent = trayPath ? fs.existsSync(trayPath) : false

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
          Plik w Persistent Directory:{' '}
          <code className="mono">
            /app/data/downloads/{tray?.filename}
          </code>
        </p>
        <p className="mono">
          status:{' '}
          {trayPresent
            ? 'OK — dostępny do pobrania'
            : 'BRAK — wgraj signed exe'}
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

      <AdminButtonsEditor initial={positions} />
    </>
  )
}
