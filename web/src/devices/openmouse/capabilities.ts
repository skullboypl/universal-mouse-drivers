/** What the OpenMouse client / demo profile can actually drive in UMD UI. */

export type OpenMouseCapabilityFlags = {
  dpi: boolean
  reportRate: boolean
  lod: boolean
  angleSnapping: boolean
  rippleControl: boolean
  motionSync: boolean
  /** OEM-style LP/HP/corded + peak - not in OpenMouse v1 flush. */
  powerModes: boolean
  buttons: boolean
  /** Sleep / long-distance / pairing - local-only unless true. */
  deviceSettings: boolean
}

export type OpenMouseDemoProfile = 'full' | 'sensor' | 'dpi'

export const OPENMOUSE_CAPS_NONE: OpenMouseCapabilityFlags = {
  dpi: false,
  reportRate: false,
  lod: false,
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
      reportRate: true,
      lod: true,
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
      reportRate: true,
      lod: true,
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
      reportRate: false,
      lod: false,
      angleSnapping: false,
      rippleControl: false,
      motionSync: false,
      powerModes: false,
      buttons: false,
      deviceSettings: false,
    },
  },
}

export function capabilitiesFromOmClient(client: {
  getStatus?: unknown
  setDpi?: unknown
  setReportRate?: unknown
  setLod?: unknown
  setAngleSnapping?: unknown
  setRippleControl?: unknown
  setMotionSync?: unknown
} | null): OpenMouseCapabilityFlags {
  if (!client) return { ...OPENMOUSE_CAPS_NONE }
  // getStatus alone still lets us show DPI readouts; writes need setters.
  const canRead = typeof client.getStatus === 'function'
  return {
    dpi: typeof client.setDpi === 'function' || canRead,
    reportRate: typeof client.setReportRate === 'function' || canRead,
    lod: typeof client.setLod === 'function',
    angleSnapping: typeof client.setAngleSnapping === 'function',
    rippleControl: typeof client.setRippleControl === 'function',
    motionSync: typeof client.setMotionSync === 'function',
    powerModes: false,
    buttons: false,
    deviceSettings: false,
  }
}
