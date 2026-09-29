/**
 * Static catalog evidence from the pinned @openmouse/protocol registry.
 * A WebHID filter is a picker hint, not a guarantee that a real device exposes
 * the command collection. Registry matches below are therefore conditional on
 * the actual HID descriptor and every control still needs a live read/verify.
 */
import { DEVICE_DRIVERS } from '@openmouse/protocol/drivers'

const CONTROL_METHODS = {
  dpiWrite: ['setDpi', 'setDpiAxes'],
  polling: ['setPollingRate', 'setReportRate'],
  lod: ['setLiftOffDistance', 'setLod'],
  motionSync: ['setMotionSync'],
  angleSnapping: ['setAngleSnapping'],
  rippleControl: ['setRippleControl'],
  debounce: ['setDebounceTime'],
  profiles: ['setProfile'],
  buttons: ['setButtonMapping'],
  rgb: ['setRgb', 'setLighting', 'setDpiLighting'],
}

const SINGLE_REPORT_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 16, 32, 63, 255]
const ALL_REPORT_IDS = Array.from({ length: 256 }, (_, id) => id)

function report(reportId, bytes = 16) {
  return { reportId, items: [{ reportSize: 8, reportCount: bytes }] }
}

function collection(usagePage, usage, reportIds) {
  const reports = reportIds.map((id) => report(id))
  return {
    usagePage,
    usage,
    featureReports: reports,
    inputReports: reports,
    outputReports: reports,
    children: [],
  }
}

function candidates(filter) {
  const usagePage = filter.usagePage ?? 0x01
  const usage = filter.usage ?? 0x02
  const shapes = [
    collection(usagePage, usage, []),
    collection(usagePage, usage, ALL_REPORT_IDS),
    ...SINGLE_REPORT_IDS.map((id) => collection(usagePage, usage, [id])),
  ]
  // Razer registry matches its mouse control collection even where the picker
  // filter is for a second consumer/vendor collection of the same VID:PID.
  if (usagePage !== 0x01 || usage !== 0x02) {
    shapes.push(collection(0x01, 0x02, ALL_REPORT_IDS))
  }
  if (filter.usagePage == null) {
    // Vendor-only picker filters (for example Glorious Classic) defer the
    // collection decision to their registry matcher.
    for (const page of [0xff00, 0xff01, 0xffff]) {
      shapes.push(collection(page, 0, [0]))
    }
  }
  return shapes.map((col) => ({
    vendorId: filter.vendorId,
    productId: filter.productId,
    productName: '',
    opened: false,
    collections: [col],
  }))
}

function matchingDrivers(filter) {
  const found = new Set()
  for (const device of candidates(filter)) {
    for (const driver of DEVICE_DRIVERS) {
      try {
        if (driver.supports(device)) found.add(driver)
      } catch {
        // A matcher that needs a real descriptor is resolved at connection time.
      }
    }
  }
  return [...found]
}

function numberArray(value) {
  return Array.isArray(value) && value.length > 0 &&
    value.length <= 2048 && value.every((n) => Number.isSafeInteger(n) && n > 0)
    ? [...new Set(value)].sort((a, b) => a - b)
    : null
}

function dpiRange(client) {
  if (typeof client.getDpiOptions !== 'function') return null
  try {
    const options = numberArray(client.getDpiOptions())
    if (!options || options.length < 2) return null
    const step = options[1] - options[0]
    if (step <= 0 || !options.every((n, i) => i === 0 || n - options[i - 1] === step)) {
      return null
    }
    return { min: options[0], max: options.at(-1), step }
  } catch {
    return null
  }
}

function pollingRates(client) {
  for (const key of ['getSupportedPollingRates', 'supportedPollingRates']) {
    try {
      const value = client[key]
      const rates = numberArray(typeof value === 'function' ? value.call(client) : value)
      if (rates) return rates
    } catch {
      // Some getters depend on a live device response.
    }
  }
  return null
}

const UNKNOWN_CONTROLS = Object.fromEntries(
  [...Object.keys(CONTROL_METHODS), 'dpiRead', 'battery'].map((key) => [key, 'unknown']),
)

function hasImplementedMethod(client, name) {
  const method = client[name]
  if (typeof method !== 'function') return false
  // A few upstream clients expose interface-compatible placeholder setters
  // whose entire body is an unconditional "not exposed" exception.
  return !/^(?:async\s+)?\w+\s*\([^)]*\)\s*\{\s*throw\b/.test(
    Function.prototype.toString.call(method).trim(),
  )
}

/**
 * @param {{ vendorId: number, productId: number, usagePage?: number, usage?: number }} filter
 */
export function capabilityForFilter(filter) {
  const matches = matchingDrivers(filter)
  if (matches.length !== 1) {
    return {
      driver: null,
      match: matches.length > 1 ? 'ambiguous' : 'unknown',
      controls: { ...UNKNOWN_CONTROLS },
      dpiRange: null,
      pollingRatesHz: null,
    }
  }

  let client
  try {
    client = matches[0].create(candidates(filter)[0])
  } catch {
    return {
      driver: null,
      match: 'runtime',
      controls: { ...UNKNOWN_CONTROLS },
      dpiRange: null,
      pollingRatesHz: null,
    }
  }
  const controls = Object.fromEntries(
    Object.entries(CONTROL_METHODS).map(([key, methods]) => [
      key,
      methods.some((method) => hasImplementedMethod(client, method)) ? 'driver' : 'unknown',
    ]),
  )
  // Battery is a status property, not a universal client method. Its presence,
  // charging state and applicability are only known after a live read.
  controls.battery = typeof client.readStatus === 'function' ? 'runtime' : 'unknown'
  controls.dpiRead = typeof client.readStatus === 'function' ? 'runtime' : 'unknown'
  return {
    driver: client.constructor.name,
    match: 'conditional',
    controls,
    dpiRange: dpiRange(client),
    pollingRatesHz: pollingRates(client),
  }
}
