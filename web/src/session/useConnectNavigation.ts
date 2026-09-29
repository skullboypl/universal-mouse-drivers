'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FENRIR_MAX_IDENTITY } from '@/devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '@/devices/mice/logitech/pro-x-superlight/identity'
import { PRO_X3_SUPERSTRIKE_IDENTITY } from '@/devices/mice/logitech/pro-x3-superstrike/identity'
import type { OpenMouseDemoProfile } from '@/devices/openmouse/capabilities'
import type { DeviceIdentity } from '@/devices/types'
import { useLocale } from '@/i18n/LocaleContext'
import { useDeviceSession } from '@/session/DeviceSessionContext'
import type { SavedDevice } from '@/session/savedDevices'
import type { HidPickTarget } from '@/transport/webhid'

function deviceLandingPath(catalogId: string): '/device/buttons' | '/device/sensor' {
  if (
    catalogId === FENRIR_MAX_IDENTITY.id ||
    catalogId === SUPERLIGHT_IDENTITY.id ||
    catalogId === PRO_X3_SUPERSTRIKE_IDENTITY.id
  ) {
    return '/device/buttons'
  }
  return '/device/sensor'
}

export function useConnectNavigation() {
  const nav = useRouter()
  const { lp } = useLocale()
  const { connectMock, connectWebHid, webHidOk } = useDeviceSession()
  const [connectingKey, setConnectingKey] = useState<string | null>(null)

  const goHid = useCallback(
    async (target?: HidPickTarget, key?: string) => {
      setConnectingKey(key ?? target?.catalogId ?? 'any')
      try {
        const catalogId = await connectWebHid(target)
        nav.push(lp(deviceLandingPath(catalogId)))
      } catch {
        /* status bar already updated */
      } finally {
        setConnectingKey(null)
      }
    },
    [connectWebHid, lp, nav],
  )

  const goSaved = useCallback(
    async (d: SavedDevice) => {
      await goHid(
        {
          productId: d.productId,
          vendorId: d.vendorId,
          catalogId: d.catalogId,
        },
        `saved:${d.vendorId}:${d.productId}`,
      )
    },
    [goHid],
  )

  const goCatalog = useCallback(
    async (d: DeviceIdentity) => {
      await goHid(
        {
          productId: d.productIds[0],
          vendorId: d.vendorId,
          catalogId: d.id,
        },
        `catalog:${d.id}`,
      )
    },
    [goHid],
  )

  const goDemo = useCallback(
    async (
      catalogId: string,
      opts?: { openMouseProfile?: OpenMouseDemoProfile },
    ) => {
      setConnectingKey(
        `demo:${catalogId}${opts?.openMouseProfile ? `:${opts.openMouseProfile}` : ''}`,
      )
      try {
        await connectMock(catalogId, opts)
        nav.push(lp(deviceLandingPath(catalogId)))
      } finally {
        setConnectingKey(null)
      }
    },
    [connectMock, lp, nav],
  )

  return {
    webHidOk,
    connectingKey,
    busyAny: connectingKey != null,
    goHid,
    goSaved,
    goCatalog,
    goDemo,
  }
}
