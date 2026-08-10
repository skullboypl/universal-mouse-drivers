'use client'

import { useEffect, useState } from 'react'
import type { DeviceWritePhase } from '../devices/DeviceDriver'
import { useDeviceSession } from '../session/DeviceSessionContext'

/** Subscribe to driver writePhase (queued → writing → ok/error → idle). */
export function useWritePhase(): DeviceWritePhase {
  const { driver } = useDeviceSession()
  const [phase, setPhase] = useState<DeviceWritePhase>(
    () => driver?.writePhase ?? 'idle',
  )

  useEffect(() => {
    if (!driver) {
      setPhase('idle')
      return
    }
    setPhase(driver.writePhase)
    return driver.onWritePhase(setPhase)
  }, [driver])

  return phase
}

/**
 * Track which UI fields are mid-write.
 * Call `touch('debounce')` when applying; clears when HID write settles.
 */
export function useFieldLoading() {
  const phase = useWritePhase()
  const [fields, setFields] = useState<ReadonlySet<string>>(() => new Set())

  useEffect(() => {
    if (phase === 'queued' || phase === 'writing') return
    const delay = phase === 'ok' ? 160 : 0
    const id = window.setTimeout(() => setFields(new Set()), delay)
    return () => window.clearTimeout(id)
  }, [phase])

  function touch(...keys: string[]) {
    setFields((prev) => {
      const next = new Set(prev)
      for (const k of keys) next.add(k)
      return next
    })
  }

  function busy(key: string) {
    return fields.has(key)
  }

  return { phase, touch, busy }
}
