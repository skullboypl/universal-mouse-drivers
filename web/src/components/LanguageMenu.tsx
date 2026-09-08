'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  LOCALES,
  LOCALE_NATIVE_NAMES,
  type Locale,
} from '@/i18n/locale'
import { useLocale } from '@/i18n/LocaleContext'
import { useT } from '@/i18n/useT'
import { FlagIcon } from './FlagIcon'
import styles from './LanguageMenu.module.css'

export function LanguageMenu() {
  const { locale, setLocale } = useLocale()
  const tr = useT()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={tr('footer.language')}
        onClick={() => setOpen((v) => !v)}
      >
        <FlagIcon locale={locale} className={styles.flag} />
        <span className={styles.triggerLabel}>
          {LOCALE_NATIVE_NAMES[locale]}
        </span>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          className={styles.menu}
          role="listbox"
          aria-label={tr('footer.language')}
        >
          {LOCALES.map((code) => {
            const active = code === locale
            return (
              <li key={code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={
                    active ? styles.optionActive : styles.option
                  }
                  onClick={() => {
                    setLocale(code as Locale)
                    setOpen(false)
                  }}
                >
                  <FlagIcon locale={code} className={styles.flag} />
                  <span>{LOCALE_NATIVE_NAMES[code]}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
