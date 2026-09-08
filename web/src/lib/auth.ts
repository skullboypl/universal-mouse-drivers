import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE = 'umd_admin'
const MAX_AGE_SEC = 60 * 60 * 24 * 7

function secret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    'umd-dev-change-me'
  )
}

/** Admin UI + APIs only on local `next dev` - never on CapRover/production. */
export function isAdminEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
}

export function adminUser(): string {
  return process.env.ADMIN_USER || 'admin'
}

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'umd-change-me'
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function createSessionToken(user: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC
  const body = `${user}.${exp}`
  return `${body}.${sign(body)}`
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [user, expStr, sig] = parts
  const body = `${user}.${expStr}`
  const expected = sign(body)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null
  if (user !== adminUser()) return null
  return user
}

export function checkCredentials(user: string, password: string): boolean {
  if (!isAdminEnabled()) return false
  const uOk = user === adminUser()
  const p = Buffer.from(password)
  const expected = Buffer.from(adminPassword())
  if (p.length !== expected.length) return false
  return uOk && timingSafeEqual(p, expected)
}

export async function getAdminSession(): Promise<string | null> {
  if (!isAdminEnabled()) return null
  const jar = await cookies()
  return verifySessionToken(jar.get(COOKIE)?.value)
}

export async function setAdminSession(user: string) {
  const jar = await cookies()
  jar.set(COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SEC,
  })
}

export async function clearAdminSession() {
  const jar = await cookies()
  jar.set(COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export { COOKIE as ADMIN_COOKIE }
