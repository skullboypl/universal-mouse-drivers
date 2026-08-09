import type { Metadata } from 'next'
import { ButtonsPage } from '@/views/ButtonsPage'

export const metadata: Metadata = { title: 'Buttons' }

export default function Page() {
  return <ButtonsPage />
}
