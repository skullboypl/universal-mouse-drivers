import { useState, type CSSProperties } from 'react'
import {
  openMouseBrandVisual,
  openMouseBrandLogoUrl,
} from '@/devices/openmouse/brandVisuals'
import {
  openMouseProductImagePath,
  openMouseUpstreamModelImagePath,
} from '@/devices/openmouse/productImages.generated'
import styles from './OpenMouseProductMark.module.css'

type Size = 'sm' | 'md' | 'lg'

type Props = {
  brandSlug: string
  brand: string
  model: string
  slug?: string
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
  slug,
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
        <OpenMouseProductImage
          key={`${brandSlug}/${slug ?? ''}`}
          brandSlug={brandSlug}
          brand={brand}
          model={model}
          slug={slug}
          logoPx={logoPx}
          decorative={decorative}
        />
      </div>
      <p className={styles.model}>{model}</p>
    </div>
  )
}

export function OpenMouseProductImage({
  brandSlug,
  brand,
  model,
  slug,
  logoPx,
  decorative,
  className,
}: {
  brandSlug: string
  brand: string
  model: string
  slug?: string
  logoPx: number
  decorative: boolean
  className?: string
}) {
  const candidates = [
    openMouseProductImagePath(brandSlug, slug),
    openMouseUpstreamModelImagePath(brandSlug, slug),
    openMouseBrandLogoUrl(brandSlug),
  ].filter((candidate, index, all): candidate is string => Boolean(candidate) && all.indexOf(candidate) === index)
  const [candidateIndex, setCandidateIndex] = useState(0)
  const src = candidates[candidateIndex]
  const imgClass = [styles.logo, className].filter(Boolean).join(' ')

  if (src) {
    return (
      <img
        className={imgClass}
        src={src}
        alt={decorative ? '' : `${brand} ${model}`}
        width={logoPx}
        height={logoPx}
        draggable={false}
        onError={() => setCandidateIndex((current) => current + 1)}
      />
    )
  }

  return (
    <svg
      className={imgClass}
      viewBox="0 0 128 128"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : `${brand} ${model}`}
      aria-hidden={decorative ? true : undefined}
      width={logoPx}
      height={logoPx}
      focusable="false"
    >
      <path
        d="M64 17c-20 0-34 15-34 38v19c0 24 14 39 34 39s34-15 34-39V55c0-23-14-38-34-38Z"
        fill="#202631"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path d="M64 18v31m-33 0h33m33 0H64" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M64 24v15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="64" cy="71" r="2.5" fill="currentColor" />
    </svg>
  )
}
