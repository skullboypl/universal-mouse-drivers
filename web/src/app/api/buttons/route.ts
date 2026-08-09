import { NextResponse } from 'next/server'
import { getButtonLayout } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public read — badge positions for King Ultra art. */
export async function GET() {
  return NextResponse.json({
    deviceId: 'king-ultra',
    positions: getButtonLayout('king-ultra'),
  })
}
