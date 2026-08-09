'use client'

import type { SelectHTMLAttributes } from 'react'
import styles from './ui.module.css'

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={styles.select} {...props} />
}
