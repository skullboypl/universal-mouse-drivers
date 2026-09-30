import type { ReactNode } from 'react'
import styles from './SettingCard.module.css'

/**
 * Rounded, elevated control card - ported from OpenMouse's own
 * `.setting-card` (.ref/app/src/control.css, AGPL-3.0, same license as this
 * repo), restyled onto our tokens: title + mono overline label + optional
 * live-value pill, then the control, then a muted note.
 */
export function SettingCard({
  title,
  overline,
  value,
  note,
  children,
}: {
  title: string
  overline?: string
  value?: string
  note?: string
  children: ReactNode
}) {
  return (
    <article className={styles.card}>
      <div className={styles.heading}>
        <div>
          {overline ? <p className={styles.overline}>{overline}</p> : null}
          <h3 className={styles.title}>{title}</h3>
        </div>
        {value ? <output className={styles.value}>{value}</output> : null}
      </div>
      {children}
      {note ? <p className={styles.note}>{note}</p> : null}
    </article>
  )
}
