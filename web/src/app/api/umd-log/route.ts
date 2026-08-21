import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  t?: number
  tag?: string
  level?: string
  args?: unknown[]
}

const MAX_BODY_BYTES = 8_192
const MAX_LINE_CHARS = 4_000

/**
 * Dev-only client log sink. Disabled in production (was a public write + log flood
 * surface). Never accept this on CapRover.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  const len = Number(req.headers.get('content-length') || 0)
  if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 413 })
  }

  let body: Body
  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false }, { status: 413 })
    }
    body = JSON.parse(raw) as Body
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const tag = String(body.tag ?? '?').slice(0, 64)
  const level = String(body.level ?? 'info').slice(0, 16)
  const args = Array.isArray(body.args) ? body.args.slice(0, 20) : []
  let line = `[umd:${tag}] ${level} ${args
    .map((a) => {
      try {
        return typeof a === 'string' ? a : JSON.stringify(a)
      } catch {
        return String(a)
      }
    })
    .join(' ')}`
  if (line.length > MAX_LINE_CHARS) line = line.slice(0, MAX_LINE_CHARS) + '…'

  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)

  try {
    const root = process.cwd()
    const file = path.join(root, '.umd-debug.log')
    await mkdir(path.dirname(file), { recursive: true })
    await appendFile(
      file,
      `${new Date(body.t ?? Date.now()).toISOString()} ${line}\n`,
      'utf8',
    )
  } catch {
    /* ignore disk errors */
  }

  return NextResponse.json({ ok: true })
}
