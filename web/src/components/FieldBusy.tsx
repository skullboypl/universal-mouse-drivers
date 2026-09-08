import type { ReactNode } from 'react'
import css from './FieldBusy.module.css'

/** Inline mini-spinner for a single setting row. */
export function FieldBusy({
  busy,
  children,
  className,
}: {
  busy: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={[css.wrap, busy ? css.on : '', className].filter(Boolean).join(' ')}
      aria-busy={busy || undefined}
    >
      {children}
      {busy ? <span className={css.spin} aria-hidden /> : null}
    </div>
  )
}
