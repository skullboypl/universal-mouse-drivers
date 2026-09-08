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
  getOpenMouseEntriesForBrand,
  getOpenMouseEntry,
  getOpenMouseNamedEntries,
  openMouseDevicePath,
  openMouseBrandPath,
  OPENMOUSE_HUB_PATH,
  openMouseImageUrl,
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

export function openMouseBrandNames(): string[] {
  return [...OPENMOUSE_BRAND_LABELS]
}
