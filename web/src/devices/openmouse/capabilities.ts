/** What the OpenMouse client / demo profile can show vs write in UMD UI. */

export type OmLodLabel = 'Low' | 'Medium' | 'High'

/** Subset of OpenMouse MouseUiHints we honor in UMD Sensor. */
export type OpenMouseUiHints = {
  settingsReady?: boolean
  valuesVerified?: boolean
  hideLodLow?: boolean
  hideUnsupportedPollingRates?: boolean
  pollingReadOnly?: boolean
  hideProcessingCard?: boolean
  hideMotionSync?: boolean
  hideAngleSnapping?: boolean
  hideRippleControl?: boolean
  statusNote?: string
  pollingNote?: string
  dpiStageEditor?: {
    maxStages: number
    countEditable?: boolean
    minDpi: number
    maxDpi: number
    stepDpi: number
  }
}

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
  /** Live rates from MouseStatus.supportedPollingRates (when present). */
  pollRatesHz?: number[] | null
  /** LOD stops the mouse actually supports. */
  lodOptions?: OmLodLabel[] | null
  /** DPI editor bounds from MouseUiHints.dpiStageEditor. */
  dpiMin?: number
  dpiMax?: number
  dpiStep?: number
  dpiMaxStages?: number
  dpiCountEditable?: boolean
  /** From MouseUiHints.statusNote / pollingNote. */
  statusNote?: string | null
  pollingNote?: string | null
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

/**
 * Merge OpenMouse MouseStatus.ui (+ status fields) into method-based caps.
 * This is how OpenMouse control.ts stays brand-agnostic per HID client.
 */
export function applyOpenMouseUiHints(
  base: OpenMouseCapabilityFlags,
  status: {
    ui?: OpenMouseUiHints | null
    supportedPollingRates?: number[]
    supportedLiftOffDistances?: OmLodLabel[]
    angleSnapping?: boolean | null
    rippleControl?: boolean | null
    motionSync?: boolean | null
  } | null,
): OpenMouseCapabilityFlags {
  if (!status) return base
  const ui = status.ui ?? {}
  const settingsReady = ui.settingsReady !== false

  let angleSnapping = base.angleSnapping
  let rippleControl = base.rippleControl
  let motionSync = base.motionSync
  if (status.angleSnapping != null) angleSnapping = true
  if (status.rippleControl != null) rippleControl = true
  if (status.motionSync != null) motionSync = true
  if (ui.hideProcessingCard) {
    angleSnapping = false
    rippleControl = false
    motionSync = false
  } else {
    if (ui.hideAngleSnapping) angleSnapping = false
    if (ui.hideRippleControl) rippleControl = false
    if (ui.hideMotionSync) motionSync = false
  }

  const editor = ui.dpiStageEditor
  const lodOptions =
    status.supportedLiftOffDistances?.length
      ? [...status.supportedLiftOffDistances]
      : ui.hideLodLow
        ? (['Medium', 'High'] as OmLodLabel[])
        : null

  return {
    ...base,
    dpi: settingsReady ? base.dpi : base.dpi && Boolean(ui.valuesVerified),
    dpiWritable: settingsReady ? base.dpiWritable : false,
    reportRate: settingsReady ? base.reportRate : base.reportRate,
    reportRateWritable:
      settingsReady && !ui.pollingReadOnly ? base.reportRateWritable : false,
    lod: settingsReady ? base.lod : base.lod,
    lodWritable: settingsReady ? base.lodWritable : false,
    angleSnapping: settingsReady ? angleSnapping : false,
    rippleControl: settingsReady ? rippleControl : false,
    motionSync: settingsReady ? motionSync : false,
    pollRatesHz: status.supportedPollingRates?.length
      ? [...status.supportedPollingRates]
      : base.pollRatesHz ?? null,
    lodOptions,
    dpiMin: editor?.minDpi ?? base.dpiMin,
    dpiMax: editor?.maxDpi ?? base.dpiMax,
    dpiStep: editor?.stepDpi ?? base.dpiStep,
    dpiMaxStages: editor?.maxStages ?? base.dpiMaxStages,
    dpiCountEditable: editor?.countEditable ?? base.dpiCountEditable,
    statusNote: ui.statusNote ?? base.statusNote ?? null,
    pollingNote: ui.pollingNote ?? base.pollingNote ?? null,
  }
}
