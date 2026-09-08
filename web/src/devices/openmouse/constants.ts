/**
 * Static OpenMouse vendor IDs + brand labels.
 * Vendor list kept inline so SSR scoring never needs the protocol package.
 * Brand labels sync from catalog.generated after `npm run generate:openmouse-catalog`.
 */
import { OPENMOUSE_BRANDS, OPENMOUSE_CATALOG } from './catalog.generated'

export const OPENMOUSE_BACKED_ID = 'openmouse-backed'

/** Unique vendor IDs used by OpenMouse DEVICE_DRIVERS / VENDOR_ID map. */
export const OPENMOUSE_VENDOR_IDS: readonly number[] = [
  1133, // logitech
  1155, // zaunkoenig
  1118, // microsoft
  2362, // glorious / ninjutso
  4152, // steelseries
  5426, // razer
  6421, // orbital / ninjutsoLegacy
  6940, // corsair
  7338, // wallhackKeyboardAlt
  7511, // attackSharkX
  8916, // gloriousClassicI
  9610, // gloriousClassic
  9639, // attackShark
  12259, // moddo
  12625, // fantech
  12771, // wooting
  12815, // gloriousClassicIWired
  13159, // endgameGear
  13284, // gwolves
  13364, // keychron
  13652, // teevolution / vgn
  13853, // finalmouse
  13991, // wlmouse
  14096, // pulsar
  14139, // atk
  14142, // lamzu / attackshark
  14228, // gloriousO3
  14256, // lamzuInca
  14391, // mchose
  14457, // wallhack
  43172, // ksnakeUsb
  43173, // ksnakeDongle
]

/** Brands present in the generated OpenMouse catalog. */
export const OPENMOUSE_BRAND_LABELS: readonly string[] =
  OPENMOUSE_BRANDS.length > 0
    ? OPENMOUSE_BRANDS
    : [
        'Logitech',
        'Razer',
        'Pulsar',
        'G-Wolves',
        'Attack Shark',
        'Lamzu',
        'WLMouse',
        'MCHOSE',
        'ATK',
        'Endgame Gear',
        'Finalmouse',
        'Glorious',
        'SteelSeries',
      ]

const vendorSet = new Set(OPENMOUSE_VENDOR_IDS)

export function matchesOpenMouseVendor(vendorId: number): boolean {
  return vendorSet.has(vendorId)
}

/** Unique vendor IDs actually present in the generated catalog. */
export function openMouseCatalogVendorIds(): number[] {
  return [...new Set(OPENMOUSE_CATALOG.map((e) => e.vendorId))].sort(
    (a, b) => a - b,
  )
}
