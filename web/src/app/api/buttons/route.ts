import { NextResponse } from 'next/server'
import { LAYOUT_META, parseLayoutId } from '@/lib/layouts'
import { getButtonLayout } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public read - badge positions (buttons page, demo, or hero). */
export async function GET(req: Request) {
  const layoutId = parseLayoutId(
    new URL(req.url).searchParams.get('layoutId'),
  )
  const meta = LAYOUT_META[layoutId]
  return NextResponse.json({
    layoutId,
    deviceId: layoutId,
    positions: getButtonLayout(layoutId),
    art: { width: meta.width, height: meta.height, imageUrl: meta.imageUrl },
  })
}
