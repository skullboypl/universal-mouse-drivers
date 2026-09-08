import fs from 'node:fs'
import { NextResponse } from 'next/server'
import { resolveDownloadFile } from '@/lib/paths'
import { getDownloadMeta, readStore } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeName(name: string): string | null {
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
    return null
  }
  return name
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ file: string }> },
) {
  const { file: raw } = await ctx.params
  const file = safeName(raw)
  if (!file) {
    return NextResponse.json({ error: 'Bad filename' }, { status: 400 })
  }

  const store = readStore()
  const allowed = Object.values(store.downloads).some((d) => d.filename === file)
  // Also allow direct UmdBatteryTray.exe even if meta missing
  const ok = allowed || file === 'UmdBatteryTray.exe'
  if (!ok) {
    return NextResponse.json({ error: 'Unknown download' }, { status: 404 })
  }

  const full = resolveDownloadFile(file)
  if (!full) {
    const meta = Object.values(store.downloads).find((d) => d.filename === file)
    return NextResponse.json(
      {
        error: 'File not uploaded yet',
        hint: `Missing ${file} in image bundled-downloads/ and /app/data/downloads/`,
        meta: meta ?? getDownloadMeta('trayBattery'),
      },
      { status: 404 },
    )
  }

  const buf = fs.readFileSync(full)
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Content-Length': String(buf.length),
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
