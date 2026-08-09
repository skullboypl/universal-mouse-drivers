import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import {
  getButtonLayout,
  setButtonLayout,
  type ButtonPosition,
} from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAdminSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    deviceId: 'king-ultra',
    positions: getButtonLayout('king-ultra'),
  })
}

export async function PUT(req: Request) {
  const user = await getAdminSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as {
    positions?: ButtonPosition[]
  } | null
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
  const saved = setButtonLayout('king-ultra', positions)
  return NextResponse.json({ ok: true, positions: saved })
}
