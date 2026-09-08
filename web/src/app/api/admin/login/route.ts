import { NextResponse } from 'next/server'
import {
  checkCredentials,
  isAdminEnabled,
  setAdminSession,
} from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const body = (await req.json().catch(() => null)) as {
    user?: string
    password?: string
  } | null
  const user = body?.user?.trim() ?? ''
  const password = body?.password ?? ''
  if (!checkCredentials(user, password)) {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
  }
  await setAdminSession(user)
  return NextResponse.json({ ok: true, user })
}
