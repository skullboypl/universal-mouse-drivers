import type { Metadata } from 'next'
import { MacroPage } from '@/views/MacroPage'

export const metadata: Metadata = { title: 'Macro' }

export default function Page() {
  return <MacroPage />
}
