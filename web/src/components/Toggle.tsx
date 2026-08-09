'use client'

import styles from './ui.module.css'

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
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
