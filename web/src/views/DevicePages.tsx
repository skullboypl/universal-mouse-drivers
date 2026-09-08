'use client'

import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import { ButtonsPage } from './ButtonsPage'
import { FenrirButtonsPage } from './fenrir/FenrirButtonsPage'
import { FenrirSensorPage } from './fenrir/FenrirSensorPage'
import { SensorPage } from './SensorPage'
import { SuperlightButtonsPage } from './superlight/SuperlightButtonsPage'
import { SuperlightSensorPage } from './superlight/SuperlightSensorPage'

/** Per-mouse UI router - Fenrir/Superlight use OEM-style pages, King keeps UMD chrome. */
export function DeviceButtonsPage() {
  const { driver } = useDeviceSession()
  if (driver?.identity.id === FENRIR_MAX_IDENTITY.id) {
    return <FenrirButtonsPage />
  }
  if (driver?.identity.id === SUPERLIGHT_IDENTITY.id) {
    return <SuperlightButtonsPage />
  }
  return <ButtonsPage />
}

export function DeviceSensorPage() {
  const { driver } = useDeviceSession()
  if (driver?.identity.id === FENRIR_MAX_IDENTITY.id) {
    return <FenrirSensorPage />
  }
  if (driver?.identity.id === SUPERLIGHT_IDENTITY.id) {
    return <SuperlightSensorPage />
  }
  return <SensorPage />
}
