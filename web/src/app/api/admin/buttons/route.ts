import { NextResponse } from 'next/server'
import { getAdminSession, isAdminEnabled } from '@/lib/auth'
import { LAYOUT_IDS, parseLayoutId, type ButtonPosition } from '@/lib/layouts'
import { getButtonLayout, setButtonLayout } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const user = await getAdminSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const layoutId = parseLayoutId(
    new URL(req.url).searchParams.get('layoutId'),
  )
  return NextResponse.json({
    layoutId,
    positions: getButtonLayout(layoutId),
  })
}

export async function PUT(req: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const user = await getAdminSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as {
    layoutId?: string
    positions?: ButtonPosition[]
  } | null
  const layoutId = parseLayoutId(body?.layoutId)
  if (!LAYOUT_IDS.includes(layoutId)) {
    return NextResponse.json({ error: 'bad layoutId' }, { status: 400 })
  }
  const positions = body?.positions
  if (!Array.isArray(positions) || positions.length === 0) {
    return NextResponse.json({ error: 'positions required' }, { status: 400 })
  }
  for (const p of positions) {
    if (
      typeof p.id !== 'number' ||
      typeof p.uiX !== 'number' ||
      typeof p.uiY !== 'number'
    ) {
      return NextResponse.json({ error: 'invalid position' }, { status: 400 })
    }
  }
  const saved = setButtonLayout(layoutId, positions)
  return NextResponse.json({ ok: true, layoutId, positions: saved })
}
