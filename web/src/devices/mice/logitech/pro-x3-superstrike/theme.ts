import { X3_VARIANTS, type X3Variant } from './protocol'

export function x3DeviceAsset(variant: X3Variant): string {
  const known = variant === 'unknown' ? null : X3_VARIANTS[variant].imageUrl
  return known ?? X3_VARIANTS['midnight-black'].imageUrl
}
