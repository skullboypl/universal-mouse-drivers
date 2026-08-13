import { NextResponse } from 'next/server'
import { clearAdminSession, isAdminEnabled } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  if (!isAdminEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await clearAdminSession()
  return NextResponse.json({ ok: true })
}
