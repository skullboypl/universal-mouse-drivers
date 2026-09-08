import { OPENMOUSE_BRAND_LABELS } from './constants'

export {
  OPENMOUSE_BACKED_ID,
  OPENMOUSE_BRAND_LABELS,
  OPENMOUSE_VENDOR_IDS,
  matchesOpenMouseVendor,
  openMouseCatalogVendorIds,
} from './constants'
export {
  OPENMOUSE_CATALOG,
  OPENMOUSE_BRANDS,
  type OpenMouseCatalogEntry,
} from './catalog.generated'
export {
  getOpenMouseBrands,
  getOpenMouseBrandCounts,
  getOpenMouseEntriesForBrand,
  getOpenMouseEntry,
  getOpenMouseNamedEntries,
  getOpenMouseFeaturedEntries,
  describeOpenMouseDevice,
  describeOpenMouseBrand,
  openMouseDevicePath,
  openMouseBrandPath,
  OPENMOUSE_HUB_PATH,
  openMouseImageUrl,
  openMouseLogoUrl,
  formatVidPid,
} from './catalog'
export {
  openMouseHidFilters,
  openMouseCatalogHidFilters,
  loadOpenMouseHidFilters,
  openMouseSupports,
  openMouseScore,
} from './filters'
export {
  createOpenMouseClient,
  findOpenMouseMatch,
  type OpenMouseMatch,
} from './detect'
export {
  OpenMouseDriverAdapter,
  createOpenMouseDriver,
} from './OpenMouseDriverAdapter'
export {
  OPENMOUSE_DEMO_PROFILES,
  capabilitiesFromOmClient,
  type OpenMouseCapabilityFlags,
  type OpenMouseDemoProfile,
} from './capabilities'

export function openMouseBrandNames(): string[] {
  return [...OPENMOUSE_BRAND_LABELS]
}
