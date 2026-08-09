import type { Metadata } from 'next'
import { SensorPage } from '@/views/SensorPage'

export const metadata: Metadata = { title: 'Sensor' }

export default function Page() {
  return <SensorPage />
}
