import { NextResponse } from 'next/server'
import { getDownloadMeta } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public manifest for UmdBatteryTray auto-update. */
export async function GET(req: Request) {
  const meta = getDownloadMeta('trayBattery')
  const filename = meta?.filename ?? 'UmdBatteryTray.exe'
  const origin = new URL(req.url).origin
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || origin

  return NextResponse.json({
    id: meta?.id ?? 'trayBattery',
    version: meta?.version ?? '0.0.0',
    filename,
    displayName: meta?.displayName ?? 'UMD Battery Tray',
    signed: Boolean(meta?.signed),
    url: `${site}/api/downloads/${filename}`,
    updatedAt: meta?.updatedAt ?? null,
  })
}
