'use client'

import type { CSSProperties } from 'react'
import { UMD } from '@/brand/umd'
import {
  openMouseBrandLogoUrl,
  openMouseBrandSlugFromLabel,
  openMouseBrandVisual,
} from '@/devices/openmouse/brandVisuals'
import type { OpenMouseCapabilityFlags } from '@/devices/openmouse/capabilities'
import { useT } from '@/i18n/useT'
import styles from './OpenMouseSessionChrome.module.css'

type Props = {
  brand: string
  model: string
  brandSlug?: string
  logoUrl?: string
  caps?: Partial<OpenMouseCapabilityFlags> | null
  note?: string | null
  pollingNote?: string | null
}

type CapChip = { id: string; label: string; mode: 'rw' | 'ro' | 'off' }

function buildChips(
  caps?: Partial<OpenMouseCapabilityFlags> | null,
): CapChip[] {
  if (!caps) return []
  const row: Array<[string, string, boolean, boolean]> = [
    ['dpi', 'DPI', Boolean(caps.dpi), Boolean(caps.dpiWritable)],
    ['poll', 'POLL', Boolean(caps.reportRate), Boolean(caps.reportRateWritable)],
    ['lod', 'LOD', Boolean(caps.lod), Boolean(caps.lodWritable)],
    ['ang', 'ANGLE', Boolean(caps.angleSnapping), Boolean(caps.angleSnapping)],
    ['rip', 'RIPPLE', Boolean(caps.rippleControl), Boolean(caps.rippleControl)],
    ['ms', 'MOTION', Boolean(caps.motionSync), Boolean(caps.motionSync)],
  ]
  return row
    .filter(([, , show]) => show)
    .map(([id, label, , writable]) => ({
      id,
      label,
      mode: writable ? 'rw' : 'ro',
    }))
}

export function OpenMouseSessionChrome({
  brand,
  model,
  brandSlug,
  logoUrl,
  caps,
  note,
  pollingNote,
}: Props) {
  const tr = useT()
  const slug = brandSlug || openMouseBrandSlugFromLabel(brand)
  const visual = openMouseBrandVisual(slug)
  const mark = logoUrl || openMouseBrandLogoUrl(slug)
  const chips = buildChips(caps)

  return (
    <aside
      className={styles.chrome}
      style={
        {
          '--om-accent': visual.accent,
          '--om-soft': visual.accentSoft,
          '--om-ink': visual.ink,
        } as CSSProperties
      }
      aria-label={tr('sensor.omChromeLabel')}
    >
      <div className={styles.top}>
        <div className={styles.identity}>
          <div className={styles.brandMark}>
            <img
              className={styles.brandLogo}
              src={mark}
              alt=""
              width={44}
              height={44}
              draggable={false}
            />
          </div>
          <div className={styles.titles}>
            <div className={styles.stackRow}>
              <span className={styles.omWord}>OpenMouse</span>
              <span className={styles.dot} aria-hidden />
              <span className={styles.brandName}>{brand}</span>
            </div>
            <p className={styles.model}>{model}</p>
          </div>
        </div>
        <a
          className={styles.supportLink}
          href={UMD.openMouseProtocolUrl}
          target="_blank"
          rel="noreferrer"
        >
          {tr('sensor.omSupportCta')}
        </a>
      </div>

      <p className={styles.disclaimer}>{tr('sensor.omSupportBlurb')}</p>

      {chips.length > 0 ? (
        <ul className={styles.caps} aria-label={tr('sensor.omCapsLabel')}>
          {chips.map((c) => (
            <li
              key={c.id}
              className={c.mode === 'rw' ? styles.capRw : styles.capRo}
              title={
                c.mode === 'rw'
                  ? tr('sensor.omCapWritable')
                  : tr('sensor.omCapReadOnly')
              }
            >
              <span className={styles.capName}>{c.label}</span>
              <span className={styles.capMode}>
                {c.mode === 'rw' ? 'RW' : 'RO'}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {(note || pollingNote) && (
        <p className={styles.note}>
          {[note, pollingNote].filter(Boolean).join(' · ')}
        </p>
      )}
    </aside>
  )
}
