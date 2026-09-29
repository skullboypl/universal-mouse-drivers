import styles from './MeasureLine.module.css'

/**
 * The site's one recurring graphic motif (DESIGN_RESEARCH_2026.md, "linia
 * pomiarowa"): a thin ruled line with short ticks and a single number or
 * label at the end. Always communicates a real position, count or value -
 * "01 / PODŁĄCZ" in the hero, "24 / 388 MODELI" in a catalog, "1600 DPI" in
 * a configurator - never a decorative background grid.
 */
export function MeasureLine({
  index,
  label,
  value,
  active = false,
}: {
  index?: string | number
  label: string
  value?: string
  active?: boolean
}) {
  const indexLabel =
    typeof index === 'number' ? String(index).padStart(2, '0') : index

  return (
    <div className={styles.line} data-active={active || undefined}>
      {indexLabel != null ? (
        <span className={styles.index}>{indexLabel}</span>
      ) : null}
      <span className={styles.label}>{label}</span>
      <span className={styles.ticks} aria-hidden />
      {value ? <span className={styles.value}>{value}</span> : null}
    </div>
  )
}
