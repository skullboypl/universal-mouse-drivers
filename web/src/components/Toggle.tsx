import styles from './ui.module.css'

export function Toggle({
  on,
  onChange,
  label,
  compact,
}: {
  on: boolean
  onChange: (next: boolean) => void
  label: string
  /** Inline toolbar toggle (no full-width row). */
  compact?: boolean
}) {
  return (
    <div
      className="row"
      style={
        compact
          ? { justifyContent: 'flex-start', gap: 10, width: 'auto' }
          : { justifyContent: 'space-between', width: '100%' }
      }
    >
      <span>{label}</span>
      <button
        type="button"
        className={on ? styles.toggleOn : styles.toggle}
        aria-pressed={on}
        aria-label={label}
        onClick={() => onChange(!on)}
      >
        <span className={styles.knob} />
      </button>
    </div>
  )
}
