'use client'

import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { PRO_X3_SUPERSTRIKE_IDENTITY } from '@/devices/mice/logitech/pro-x3-superstrike/identity'
import { VIPER_V4_PRO_IDENTITY } from '@/devices/mice/razer/viper-v4-pro/identity'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import { ButtonsPage } from './ButtonsPage'
import { FenrirButtonsPage } from './fenrir/FenrirButtonsPage'
import { FenrirSensorPage } from './fenrir/FenrirSensorPage'
import { SensorPage } from './SensorPage'
import { SettingsPage } from './SettingsPage'
import { SuperlightButtonsPage } from './superlight/SuperlightButtonsPage'
import { SuperlightSensorPage } from './superlight/SuperlightSensorPage'
import { ProX3Workspace } from './pro-x3/ProX3Workspace'
import { ViperV4Workspace } from './viper-v4/ViperV4Workspace'

/** Per-mouse UI router - Fenrir/Superlight use OEM-style pages, King keeps UMD chrome. */
export function DeviceButtonsPage() {
  const { driver } = useDeviceSession()
  if (driver?.identity.id === FENRIR_MAX_IDENTITY.id) {
    return <FenrirButtonsPage />
  }
  if (driver?.identity.id === SUPERLIGHT_IDENTITY.id) {
    return <SuperlightButtonsPage />
  }
  if (driver?.identity.id === PRO_X3_SUPERSTRIKE_IDENTITY.id) return <ProX3Workspace />
  if (driver?.identity.id === VIPER_V4_PRO_IDENTITY.id) {
    return <ViperV4Workspace tab="customize" />
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
  if (driver?.identity.id === PRO_X3_SUPERSTRIKE_IDENTITY.id) return <ProX3Workspace />
  if (driver?.identity.id === VIPER_V4_PRO_IDENTITY.id) {
    return <ViperV4Workspace tab="performance" />
  }
  return <SensorPage />
}

export function DeviceSettingsPage() {
  const { driver } = useDeviceSession()
  if (driver?.identity.id === VIPER_V4_PRO_IDENTITY.id) {
    return <ViperV4Workspace tab="power" />
  }
  if (driver?.identity.id === PRO_X3_SUPERSTRIKE_IDENTITY.id) return <ProX3Workspace />
  return <SettingsPage />
}

export function DeviceCalibrationPage() {
  const { driver } = useDeviceSession()
  if (driver?.identity.id === VIPER_V4_PRO_IDENTITY.id) {
    return <ViperV4Workspace tab="calibration" />
  }
  return <SettingsPage />
}

export function DeviceAdvancedPage() {
  const { driver } = useDeviceSession()
  if (driver?.identity.id === VIPER_V4_PRO_IDENTITY.id) {
    return <ViperV4Workspace tab="advanced" />
  }
  return <SettingsPage />
}
