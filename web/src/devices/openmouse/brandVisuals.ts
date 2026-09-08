/** Brand accents + asset URLs for OpenMouse community catalog. */

export type OpenMouseBrandVisual = {
  brandSlug: string
  accent: string
  accentSoft: string
  ink: string
  mark: string
}

const VISUALS: Record<string, Omit<OpenMouseBrandVisual, 'brandSlug'>> = {
  atk: { accent: '#ff4d4d', accentSoft: '#3a1515', ink: '#fff5f5', mark: 'ATK' },
  corsair: { accent: '#ffd700', accentSoft: '#2a2410', ink: '#fffef5', mark: 'COR' },
  fantech: { accent: '#e85d04', accentSoft: '#2a1808', ink: '#fff8f0', mark: 'FAN' },
  finalmouse: { accent: '#f5f5f5', accentSoft: '#222', ink: '#111', mark: 'FM' },
  'g-wolves': { accent: '#18a058', accentSoft: '#0f2418', ink: '#e8ffe8', mark: 'GW' },
  glorious: { accent: '#c084fc', accentSoft: '#1f1430', ink: '#faf5ff', mark: 'GL' },
  'k-snake': { accent: '#22d3ee', accentSoft: '#0c2228', ink: '#ecfeff', mark: 'KS' },
  keychron: { accent: '#60a5fa', accentSoft: '#0f1c2e', ink: '#eff6ff', mark: 'KC' },
  lamzu: { accent: '#fb7185', accentSoft: '#2a1218', ink: '#fff1f2', mark: 'LZ' },
  mchose: { accent: '#a3e635', accentSoft: '#1a2410', ink: '#f7fee7', mark: 'MC' },
  microsoft: { accent: '#00a4ef', accentSoft: '#0c1e2a', ink: '#f0f9ff', mark: 'MS' },
  ninjutso: { accent: '#f97316', accentSoft: '#2a1608', ink: '#fff7ed', mark: 'NJ' },
  pulsar: { accent: '#e11d48', accentSoft: '#2a0c14', ink: '#fff1f2', mark: 'PU' },
  razer: { accent: '#44d62c', accentSoft: '#102010', ink: '#f0fff0', mark: 'RZ' },
  steelseries: { accent: '#ff6400', accentSoft: '#2a1608', ink: '#fff7ed', mark: 'SS' },
  teevolution: { accent: '#38bdf8', accentSoft: '#0c1e28', ink: '#f0f9ff', mark: 'TV' },
  vgn: { accent: '#fbbf24', accentSoft: '#2a2008', ink: '#fffbeb', mark: 'VGN' },
  wallhack: { accent: '#e2e8f0', accentSoft: '#1a1f28', ink: '#0f172a', mark: 'WH' },
  wooting: { accent: '#ff5a36', accentSoft: '#2a120c', ink: '#fff5f2', mark: 'WO' },
  zaunkoenig: { accent: '#94a3b8', accentSoft: '#1a2030', ink: '#f8fafc', mark: 'ZK' },
}

const FALLBACK: Omit<OpenMouseBrandVisual, 'brandSlug'> = {
  accent: '#0ea5e9',
  accentSoft: '#0c1e2a',
  ink: '#e0f2fe',
  mark: 'OM',
}

export function openMouseBrandVisual(brandSlug: string): OpenMouseBrandVisual {
  const base = VISUALS[brandSlug] ?? FALLBACK
  return { brandSlug, ...base }
}

import { OPENMOUSE_LOGO_RASTER } from './logoAssets.generated'

/** Square brand mark (chip / badge). Prefer raster when available - SVG data-URI embeds do not render in <img>. */
export function openMouseBrandLogoUrl(brandSlug: string): string {
  const ext = OPENMOUSE_LOGO_RASTER[brandSlug]
  if (ext) return `/devices/openmouse/logos/${brandSlug}-icon.${ext}`
  return `/devices/openmouse/logos/${brandSlug}-icon.svg`
}

/** Wide brand wordmark. */
export function openMouseBrandWordmarkUrl(brandSlug: string): string {
  return `/devices/openmouse/logos/${brandSlug}.svg`
}

/** Product packshot for a brand (PNG) - fallback when no per-model photo. */
export function openMouseBrandImageUrl(brandSlug: string): string {
  return openMouseBrandLogoUrl(brandSlug)
}

export function openMouseDeviceImageUrl(
  brandSlug: string,
  productName?: string,
): string {
  if (
    brandSlug === 'g-wolves' &&
    productName &&
    /fenrir|fenir/i.test(productName)
  ) {
    return '/devices/fenrir-max/mouse.png'
  }
  return openMouseBrandImageUrl(brandSlug)
}

export function openMouseDeviceDescription(
  name: string,
  brand: string,
  vidPid: string,
  locale: string,
): string {
  if (locale === 'pl') {
    return `${name} (${brand}) - sterownik społecznościowy OpenMouse w Universal Mouse Drivers (WebHID) na umdrivers.com. Identyfikator HID ${vidPid}. Połącz w Chrome lub Edge, aby ustawić DPI i podstawowe opcje sensora (zakres zależy od klienta OpenMouse).`
  }
  return `${name} (${brand}) - OpenMouse community driver in Universal Mouse Drivers (WebHID) at umdrivers.com. HID id ${vidPid}. Connect in Chrome or Edge to adjust DPI and basic sensor options (depth follows the OpenMouse client).`
}

export function openMouseBrandDescription(
  brand: string,
  count: number,
  locale: string,
): string {
  if (locale === 'pl') {
    return `${brand}: ${count} urządzeń w katalogu OpenMouse × UMD. Przeglądaj modele, filtruj i łącz przez WebHID w przeglądarce - bez ciężkiego instalatora OEM.`
  }
  return `${brand}: ${count} devices in the OpenMouse × UMD catalog. Browse models, filter, and connect over WebHID in the browser - no heavy OEM installer.`
}
