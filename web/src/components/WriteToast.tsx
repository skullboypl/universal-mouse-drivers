'use client'

import { useEffect, useState } from 'react'
import type { DeviceWritePhase } from '../devices/DeviceDriver'
import { useT } from '../i18n/useT'
import { useDeviceSession } from '../session/DeviceSessionContext'
import styles from './WriteToast.module.css'

export function WriteToast() {
  const { driver, connected } = useDeviceSession()
  const tr = useT()
  const [phase, setPhase] = useState<DeviceWritePhase>('idle')
  const [note, setNote] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!driver) {
      setPhase('idle')
      setVisible(false)
      return
    }
    const unsub = driver.onWritePhase((p) => {
      setPhase(p)
      setNote(driver.lastVerifyNote ?? driver.lastWriteError)
      if (p === 'idle') {
        setVisible(false)
        return
      }
      setVisible(true)
    })
    return () => {
      unsub()
    }
  }, [driver])

  useEffect(() => {
    if (phase !== 'ok' && phase !== 'error') return
    const id = window.setTimeout(() => setVisible(false), phase === 'error' ? 4200 : 1600)
    return () => clearTimeout(id)
  }, [phase])

  if (!connected || !visible || phase === 'idle') return null

  const label =
    phase === 'queued'
      ? tr('write.queued')
      : phase === 'writing'
        ? tr('write.writing')
        : phase === 'ok'
          ? tr('write.ok')
          : tr('write.error')

  return (
    <div
      className={`${styles.toast} ${styles[phase]}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.row}>
        <span className={styles.dot} aria-hidden />
        <div>
          <div className={styles.label}>{label}</div>
          {phase === 'error' && note ? (
            <div className={styles.note}>{note}</div>
          ) : null}
        </div>
      </div>
      {(phase === 'queued' || phase === 'writing') && (
        <div className={styles.barTrack}>
          <div className={styles.bar} />
        </div>
      )}
    </div>
  )
}
