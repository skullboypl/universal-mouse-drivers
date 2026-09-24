/** What the OpenMouse client / demo profile can show vs write in UMD UI. */

export type OpenMouseCapabilityFlags = {
  /** Show DPI panel (read and/or write). */
  dpi: boolean
  dpiWritable: boolean
  reportRate: boolean
  reportRateWritable: boolean
  lod: boolean
  lodWritable: boolean
  angleSnapping: boolean
  rippleControl: boolean
  motionSync: boolean
  /** OEM-style LP/HP/corded + peak - not in OpenMouse v1 flush. */
  powerModes: boolean
  buttons: boolean
  /** Sleep / long-distance / tray - local-only unless true. */
  deviceSettings: boolean
}

export type OpenMouseDemoProfile = 'full' | 'sensor' | 'dpi'

export const OPENMOUSE_CAPS_NONE: OpenMouseCapabilityFlags = {
  dpi: false,
  dpiWritable: false,
  reportRate: false,
  reportRateWritable: false,
  lod: false,
  lodWritable: false,
  angleSnapping: false,
  rippleControl: false,
  motionSync: false,
  powerModes: false,
  buttons: false,
  deviceSettings: false,
}

export const OPENMOUSE_DEMO_PROFILES: Record<
  OpenMouseDemoProfile,
  { caps: OpenMouseCapabilityFlags; model: string; note: string }
> = {
  full: {
    model: 'Community · full surface',
    note: 'Demo: DPI + poll + LOD + sensor toggles (as if client exposes setters)',
    caps: {
      dpi: true,
      dpiWritable: true,
      reportRate: true,
      reportRateWritable: true,
      lod: true,
      lodWritable: true,
      angleSnapping: true,
      rippleControl: true,
      motionSync: true,
      powerModes: false,
      buttons: false,
      deviceSettings: false,
    },
  },
  sensor: {
    model: 'Community · sensor basic',
    note: 'Demo: DPI + poll + LOD only',
    caps: {
      dpi: true,
      dpiWritable: true,
      reportRate: true,
      reportRateWritable: true,
      lod: true,
      lodWritable: true,
      angleSnapping: false,
      rippleControl: false,
      motionSync: false,
      powerModes: false,
      buttons: false,
      deviceSettings: false,
    },
  },
  dpi: {
    model: 'Community · DPI only',
    note: 'Demo: DPI only (minimal OpenMouse client)',
    caps: {
      dpi: true,
      dpiWritable: true,
      reportRate: false,
      reportRateWritable: false,
      lod: false,
      lodWritable: false,
      angleSnapping: false,
      rippleControl: false,
      motionSync: false,
      powerModes: false,
      buttons: false,
      deviceSettings: false,
    },
  },
}

/** OpenMouse HID clients use readStatus / setPollingRate / setLiftOffDistance. */
export function capabilitiesFromOmClient(client: {
  readStatus?: unknown
  getStatus?: unknown
  setDpi?: unknown
  setPollingRate?: unknown
  setReportRate?: unknown
  setLiftOffDistance?: unknown
  setLod?: unknown
  setAngleSnapping?: unknown
  setRippleControl?: unknown
  setMotionSync?: unknown
} | null): OpenMouseCapabilityFlags {
  if (!client) return { ...OPENMOUSE_CAPS_NONE }
  const canRead =
    typeof client.readStatus === 'function' ||
    typeof client.getStatus === 'function'
  const dpiWritable = typeof client.setDpi === 'function'
  const rateWritable =
    typeof client.setPollingRate === 'function' ||
    typeof client.setReportRate === 'function'
  const lodWritable =
    typeof client.setLiftOffDistance === 'function' ||
    typeof client.setLod === 'function'
  return {
    dpi: dpiWritable || canRead,
    dpiWritable,
    reportRate: rateWritable || canRead,
    reportRateWritable: rateWritable,
    lod: lodWritable || canRead,
    lodWritable,
    angleSnapping: typeof client.setAngleSnapping === 'function',
    rippleControl: typeof client.setRippleControl === 'function',
    motionSync: typeof client.setMotionSync === 'function',
    powerModes: false,
    buttons: false,
    deviceSettings: false,
  }
}
