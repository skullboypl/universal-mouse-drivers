import { FENRIR_MAX_IDENTITY } from '../devices/gwolves-fenrir-max/identity'
import { useDeviceSession } from '../session/DeviceSessionContext'
import { ButtonsPage } from './ButtonsPage'
import { FenrirButtonsPage } from './fenrir/FenrirButtonsPage'
import { FenrirSensorPage } from './fenrir/FenrirSensorPage'
import { SensorPage } from './SensorPage'

/** Per-mouse UI router — Fenrir uses OEM-style pages, King keeps UMD chrome. */
export function DeviceButtonsPage() {
  const { driver } = useDeviceSession()
  if (driver?.identity.id === FENRIR_MAX_IDENTITY.id) {
    return <FenrirButtonsPage />
  }
  return <ButtonsPage />
}

export function DeviceSensorPage() {
  const { driver } = useDeviceSession()
  if (driver?.identity.id === FENRIR_MAX_IDENTITY.id) {
    return <FenrirSensorPage />
  }
  return <SensorPage />
}
