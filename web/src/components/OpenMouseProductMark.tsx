import type { CSSProperties } from 'react'
import {
  openMouseBrandVisual,
  openMouseBrandLogoUrl,
} from '@/devices/openmouse/brandVisuals'
import styles from './OpenMouseProductMark.module.css'

type Size = 'sm' | 'md' | 'lg'

type Props = {
  brandSlug: string
  brand: string
  model: string
  size?: Size
  className?: string
  /** Decorative only (parent link provides accessible name). */
  decorative?: boolean
}

const LOGO_PX: Record<Size, number> = {
  sm: 40,
  md: 56,
  lg: 88,
}

export function OpenMouseProductMark({
  brandSlug,
  brand,
  model,
  size = 'md',
  className,
  decorative = true,
}: Props) {
  const visual = openMouseBrandVisual(brandSlug)
  const logoPx = LOGO_PX[size]
  const rootClass = [
    styles.mark,
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={rootClass}
      style={
        {
          '--om-accent': visual.accent,
          '--om-soft': visual.accentSoft,
          '--om-ink': visual.ink,
        } as CSSProperties
      }
      aria-hidden={decorative ? true : undefined}
    >
      <div className={styles.logoWrap}>
        <img
          className={styles.logo}
          src={openMouseBrandLogoUrl(brandSlug)}
          alt={decorative ? '' : brand}
          width={logoPx}
          height={logoPx}
          draggable={false}
        />
      </div>
      <p className={styles.model}>{model}</p>
    </div>
  )
}
