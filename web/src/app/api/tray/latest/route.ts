import { NextResponse } from 'next/server'
import { getDownloadMeta } from '@/lib/store'
import { getTrayDownloadBaseUrl } from '@/lib/site'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public manifest for UmdBatteryTray auto-update.
 * Works on umdrivers.com and legacy hosts (mouse.vxh.pl) when CapRover
 * aliases those domains to this app. `url` is always the canonical site.
 */
export async function GET() {
  const meta = getDownloadMeta('trayBattery')
  const filename = meta?.filename ?? 'UmdBatteryTray.exe'
  const site = getTrayDownloadBaseUrl()

  return NextResponse.json(
    {
      id: meta?.id ?? 'trayBattery',
      version: meta?.version ?? '0.0.0',
      filename,
      displayName: meta?.displayName ?? 'UMD Battery Tray',
      signed: Boolean(meta?.signed),
      url: `${site}/api/downloads/${filename}`,
      updatedAt: meta?.updatedAt ?? null,
    },
    {
      headers: {
        // Old / cross-origin clients; harmless for HttpClient.
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
}
