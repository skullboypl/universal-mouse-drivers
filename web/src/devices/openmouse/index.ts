import { OPENMOUSE_BRAND_LABELS } from './constants'

export {
  OPENMOUSE_BACKED_ID,
  OPENMOUSE_BRAND_LABELS,
  OPENMOUSE_VENDOR_IDS,
  matchesOpenMouseVendor,
} from './constants'
export {
  openMouseHidFilters,
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
