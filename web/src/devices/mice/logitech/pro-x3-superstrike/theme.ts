import { X3_VARIANTS, type X3Variant } from './protocol'

/** Same Logitech G cyan as PRO X SUPERLIGHT gen1 - one visual language per brand. */
export const X3_OEM = {
  accent: '#00a0e3',
  accentHot: '#33b5eb',
  accentSoft: 'rgba(0, 160, 227, 0.16)',
  deviceDisplayWidth: 300,
} as const

export function x3DeviceAsset(variant: X3Variant): string {
  const known = variant === 'unknown' ? null : X3_VARIANTS[variant].imageUrl
  return known ?? X3_VARIANTS['midnight-black'].imageUrl
}
