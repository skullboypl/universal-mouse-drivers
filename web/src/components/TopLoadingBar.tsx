'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import styles from './TopLoadingBar.module.css'

/**
 * Slim indeterminate bar above the header - the only global "something is
 * happening" cue that isn't tied to one specific button. Fires on route
 * changes (app router gives no real navigation-start/end event, so this is
 * a short fixed pulse) and stays up for the actual device-busy state
 * (connecting, syncing, reading from the mouse).
 */
export function TopLoadingBar() {
  const { deviceBusy } = useDeviceSession()
  const pathname = usePathname()
  const [navigating, setNavigating] = useState(false)

  useEffect(() => {
    setNavigating(true)
    const id = window.setTimeout(() => setNavigating(false), 420)
    return () => window.clearTimeout(id)
    // Re-fires on every route change, which is exactly the signal we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const active = navigating || deviceBusy

  return (
    <div className={styles.track} aria-hidden={!active}>
      {active ? <div className={styles.bar} /> : null}
    </div>
  )
}
