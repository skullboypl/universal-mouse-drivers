import { notFound } from 'next/navigation'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton'
import { getAdminSession, isAdminEnabled } from '@/lib/auth'
import {
  bundledDownloadsDir,
  downloadsDir,
  resolveDownloadFile,
} from '@/lib/paths'
import { getButtonLayout, getDownloadMeta } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Production (CapRover): no admin UI — badge positions ship in code / seed.
  if (!isAdminEnabled()) notFound()

  const user = await getAdminSession()
  if (!user) {
    return (
      <>
        <h1 className="page-title">UMD Admin</h1>
        <p className="page-sub">
          Local only — ustaw pozycje znaczków 1–6, potem commituj defaults do
          kodu (produkcja pokazuje je bez /admin).
        </p>
        <AdminLoginForm />
      </>
    )
  }

  const buttonsLayout = getButtonLayout('king-ultra')
  const blitzLayout = getButtonLayout('blitz-ultimate')
  const demoLayout = getButtonLayout('umd-demo')
  const fenrirLayout = getButtonLayout('fenrir-max')
  const heroLayout = getButtonLayout('king-ultra-hero')
  const trayMeta = getDownloadMeta('trayBattery')
  const filename = trayMeta?.filename ?? 'UmdBatteryTray.exe'
  const trayResolved = resolveDownloadFile(filename)
  const trayPresent = Boolean(trayResolved)
  const traySource = trayResolved
    ? trayResolved.startsWith(bundledDownloadsDir())
      ? 'bundled (image)'
      : 'persistent /app/data/downloads'
    : 'missing'

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <AdminLogoutButton />
      </div>
      <AdminDashboard
        user={user}
        buttonsLayout={buttonsLayout}
        blitzLayout={blitzLayout}
        demoLayout={demoLayout}
        fenrirLayout={fenrirLayout}
        heroLayout={heroLayout}
        tray={{
          present: trayPresent,
          source: traySource,
          downloadsPath: downloadsDir(),
          filename,
          signed: Boolean(trayMeta?.signed),
          version: trayMeta?.version ?? '',
        }}
      />
    </>
  )
}
