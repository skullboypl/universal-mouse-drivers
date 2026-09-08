'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './ui.module.css'

type Variant = 'default' | 'primary' | 'ghost'

export function Button({
  variant = 'default',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}) {
  const v =
    variant === 'primary'
      ? styles.btnPrimary
      : variant === 'ghost'
        ? styles.btnGhost
        : styles.btn
  return (
    <button className={[v, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </button>
  )
}
