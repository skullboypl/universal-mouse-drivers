/**
 * Pill-button group - ported from OpenMouse's own `Segmented` component
 * (.ref/app/src/app/ui.tsx, AGPL-3.0, same license as this repo), restyled
 * onto our own tokens instead of theirs. Used for every "pick one of a few
 * options" control (report rate, LOD, gaming surface, LightForce...)
 * instead of a `<select>`.
 */
import styles from './Segmented.module.css'

export type SegmentedOption<T> = {
  value: T
  label: string
  hidden?: boolean
  disabled?: boolean
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled,
}: {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T | null | undefined
  onChange: (next: T) => void
  ariaLabel: string
  disabled?: boolean
}) {
  return (
    <div className={styles.group} role="group" aria-label={ariaLabel}>
      {options.map((option) =>
        option.hidden ? null : (
          <button
            key={String(option.value)}
            type="button"
            className={option.value === value ? styles.selected : styles.option}
            aria-pressed={option.value === value}
            disabled={disabled || option.disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ),
      )}
    </div>
  )
}
