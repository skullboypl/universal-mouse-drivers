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

/** Client `umdLog` → terminal + `.umd-debug.log` (dev RE aid). */
export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const tag = body.tag ?? '?'
  const level = body.level ?? 'info'
  const args = body.args ?? []
  const line = `[umd:${tag}] ${level} ${args
    .map((a) => {
      try {
        return typeof a === 'string' ? a : JSON.stringify(a)
      } catch {
        return String(a)
      }
    })
    .join(' ')}`

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
    /* ignore disk errors in prod */
  }

  return NextResponse.json({ ok: true })
}
