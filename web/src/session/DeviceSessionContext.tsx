'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { umdLog } from '../debug/umdLog'
import type { DeviceDriver } from '../devices/DeviceDriver'
import { createDriver, DEVICE_CATALOG, findCatalogDevice } from '../devices/registry'
import { FENRIR_MAX_IDENTITY } from '../devices/mice/gwolves/fenrir-max/identity'
import { SUPERLIGHT_IDENTITY } from '../devices/mice/logitech/pro-x-superlight/identity'
import { KING_ULTRA_IDENTITY } from '../devices/mice/redragon/king-ultra/identity'
import {
  OPENMOUSE_BACKED_ID,
  createOpenMouseDriver,
  openMouseSupports,
  type OpenMouseDemoProfile,
} from '../devices/openmouse'
import type { DeviceState } from '../devices/types'
import { t } from '../i18n/messages'
import { normalizeLocale, readStoredLocale, type Locale } from '../i18n/locale'
import { createMockTransport } from '../transport/mock'
import {
  createWebHidTransport,
  pickSupportedHidDevice,
  webHidSupported,
  type HidPickTarget,
} from '../transport/webhid'
import type { TransportKind } from '../transport/types'
import { loadSavedDraft, persistDraft } from './autoSave'
import {
  loadSavedDevices,
  rememberDevice,
  type SavedDevice,
} from './savedDevices'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface SessionValue {
  connected: boolean
  transportKind: TransportKind | null
  status: string | null
  saveStatus: SaveStatus
  /** True while HID sync/write is in progress - UI should ignore clicks. */
  deviceBusy: boolean
  /** Why deviceBusy is on - SyncSpinner label (connect vs refresh read). */
  busyKind: 'connect' | 'refresh' | null
  state: DeviceState | null
  driver: DeviceDriver | null
  webHidOk: boolean
  /** Catalog id while connecting / syncing - drives shell skin before driver is ready. */
  connectingCatalogId: string | null
  savedDevices: SavedDevice[]
  connectMock: (
    catalogId?: string,
    opts?: { openMouseProfile?: OpenMouseDemoProfile },
  ) => Promise<void>
  connectWebHid: (target?: number | HidPickTarget) => Promise<string>
  disconnect: () => Promise<void>
  refreshSavedDevices: () => void
  syncFromDriver: () => void
  apply: (
    fn: (driver: DeviceDriver) => void | Promise<void>,
    opts?: { autosave?: boolean },
  ) => Promise<void>
  /** Read-only HID refresh (no autosave / no write toast). */
  refreshFromDevice: () => Promise<void>
}

const DeviceSessionContext = createContext<SessionValue | null>(null)
const AUTOSAVE_MS = 450

function cloneState(state: DeviceState): DeviceState {
  return structuredClone(state)
}

function uiLocale(raw?: string | null): Locale {
  return normalizeLocale(raw) ?? readStoredLocale() ?? 'pl'
}

function mergeDraft(driver: DeviceDriver) {
  const draft = loadSavedDraft(driver.identity.id)
  if (!draft) return
  try {
    driver.importProfile(
      JSON.stringify({
        device: driver.identity.id,
        ...draft,
      }),
    )
    const lang = uiLocale(driver.getState().settings.language)
    driver.patchSettings({ language: lang })
  } catch {
    /* ignore corrupt draft */
  }
}

export function DeviceSessionProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<DeviceDriver | null>(null)
  const [transportKind, setTransportKind] = useState<TransportKind | null>(null)
  const [state, setState] = useState<DeviceState | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [deviceBusy, setDeviceBusy] = useState(false)
  /** 'connect' | 'refresh' while deviceBusy - picks SyncSpinner label. */
  const [busyKind, setBusyKind] = useState<'connect' | 'refresh' | null>(null)
  const [connectingCatalogId, setConnectingCatalogId] = useState<string | null>(
    null,
  )
  // SSR-safe: localStorage / navigator.hid differ on server vs client.
  const [savedDevices, setSavedDevices] = useState<SavedDevice[]>([])
  const [webHidOk, setWebHidOk] = useState(false)
  const driverRef = useRef<DeviceDriver | null>(null)
  const transportKindRef = useRef<TransportKind | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    setWebHidOk(webHidSupported())
    setSavedDevices(loadSavedDevices())
  }, [])

  const publish = useCallback((d: DeviceDriver | null) => {
    driverRef.current = d
    setDriver(d)
    setState(d ? cloneState(d.getState()) : null)
  }, [])

  const refreshSavedDevices = useCallback(() => {
    setSavedDevices(loadSavedDevices())
  }, [])

  const scheduleAutoSave = useCallback(() => {
    const d = driverRef.current
    if (!d) return
    setSaveStatus('dirty')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const current = driverRef.current
      if (!current) return
      setSaveStatus('saving')
      void (async () => {
        try {
          const snap = cloneState(current.getState())
          persistDraft(current.identity.id, snap)
          const flush = await current.flushToDevice()
          if (flush.wrote === false && current.writePhase === 'error') {
            setSaveStatus('error')
            return
          }
          setSaveStatus('saved')
          const lang = uiLocale(snap.settings.language)
          const kind = transportKindRef.current
          setStatus(
            `${t(lang, kind === 'webhid' ? 'status.webhid' : 'status.mock')} · ${t(lang, 'status.saved')}`,
          )
        } catch {
          setSaveStatus('error')
        }
      })()
    }, AUTOSAVE_MS)
  }, [])

  const syncFromDriver = useCallback(() => {
    const d = driverRef.current
    setState(d ? cloneState(d.getState()) : null)
  }, [])

  const apply = useCallback(
    async (
      fn: (driver: DeviceDriver) => void | Promise<void>,
      opts?: { autosave?: boolean },
    ) => {
      const d = driverRef.current
      if (!d) return
      if (busyRef.current) {
        umdLog('session', 'warn', 'apply ignored - device busy (sync/write)')
        return
      }
      try {
        const result = fn(d)
        setState(cloneState(d.getState()))
        if (opts?.autosave !== false) scheduleAutoSave()
        if (result && typeof (result as Promise<void>).then === 'function') {
          await result
          setState(cloneState(d.getState()))
        }
      } catch (err) {
        const lang = uiLocale(d.getState().settings.language)
        setStatus(
          err instanceof Error ? err.message : t(lang, 'status.applyFailed'),
        )
        setState(cloneState(d.getState()))
      }
    },
    [scheduleAutoSave],
  )

  const refreshFromDevice = useCallback(async () => {
    const d = driverRef.current
    if (!d || busyRef.current) return
    const lang = uiLocale(d.getState().settings.language)
    busyRef.current = true
    setBusyKind('refresh')
    setDeviceBusy(true)
    setStatus(t(lang, 'status.reading'))
    try {
      await d.probeFlashAndSync()
      if (driverRef.current !== d) return
      setState(cloneState(d.getState()))
      setStatus(d.lastVerifyNote ?? t(lang, 'status.readOk'))
      umdLog('session', 'info', 'refreshFromDevice done', {
        note: d.lastVerifyNote,
        mouseReachable: d.mouseReachable,
      })
    } catch (err) {
      umdLog(
        'session',
        'error',
        'refreshFromDevice failed',
        err instanceof Error ? err.message : String(err),
      )
      setStatus(
        err instanceof Error ? err.message : t(lang, 'status.applyFailed'),
      )
    } finally {
      if (driverRef.current === d) {
        busyRef.current = false
        setDeviceBusy(false)
        setBusyKind(null)
      }
    }
  }, [])

  const connectMock = useCallback(
    async (
      catalogId?: string,
      opts?: { openMouseProfile?: OpenMouseDemoProfile },
    ) => {
    const lang0 = uiLocale()
    setStatus(t(lang0, 'status.connectingDemo'))
    const id = catalogId ?? KING_ULTRA_IDENTITY.id
    setConnectingCatalogId(id)
    const d =
      id === OPENMOUSE_BACKED_ID
        ? createOpenMouseDriver(undefined, opts?.openMouseProfile ?? 'full')
        : createDriver(id)
    const transport = createMockTransport()
    await d.attach(transport)
    mergeDraft(d)
    d.patchSettings({ language: uiLocale() })
    transportKindRef.current = 'mock'
    setTransportKind('mock')
    publish(d)
    const lang = uiLocale(d.getState().settings.language)
    setStatus(t(lang, 'status.mock'))
    setSaveStatus('idle')
    setConnectingCatalogId(null)
  },
  [publish],
)

  const connectWebHid = useCallback(
    async (target?: number | HidPickTarget) => {
      const lang0 = uiLocale()
      const opts: HidPickTarget | undefined =
        typeof target === 'number' ? { productId: target } : target
      if (opts?.catalogId) setConnectingCatalogId(opts.catalogId)
      setStatus(t(lang0, 'status.selectMouse'))
      try {
        const picked = await pickSupportedHidDevice(opts)
        const catalogFromPick = findCatalogDevice(
          picked.vendorId,
          picked.productId,
        )
        const openMouse =
          !catalogFromPick && openMouseSupports(picked)
            ? createOpenMouseDriver(picked)
            : null
        if (
          opts?.catalogId &&
          opts.catalogId !== OPENMOUSE_BACKED_ID &&
          catalogFromPick &&
          catalogFromPick.id !== opts.catalogId
        ) {
          throw new Error(
            `Podłączono inne urządzenie niż wybrane (${opts.catalogId})`,
          )
        }
        if (
          opts?.catalogId === OPENMOUSE_BACKED_ID &&
          !openMouse &&
          !catalogFromPick
        ) {
          throw new Error('OpenMouse does not support the selected HID device')
        }
        const catalog =
          catalogFromPick ??
          (openMouse ? openMouse.identity : undefined) ??
          (opts?.catalogId
            ? DEVICE_CATALOG.find((c) => c.id === opts.catalogId)
            : undefined) ??
          KING_ULTRA_IDENTITY

        setConnectingCatalogId(catalog.id)
        const d = openMouse ?? createDriver(catalog.id)

        const useNative =
          catalog.id === FENRIR_MAX_IDENTITY.id ||
          catalog.id === SUPERLIGHT_IDENTITY.id ||
          catalog.id === OPENMOUSE_BACKED_ID

        // Show device UI immediately (defaults) → SyncSpinner → attach + probe.
        // Do not await HID open/read before navigation (Logitech was blocking on Connect).
        mergeDraft(d)
        d.patchSettings({ language: uiLocale() })
        transportKindRef.current = 'webhid'
        setTransportKind('webhid')
        publish(d)
        const lang = uiLocale(d.getState().settings.language)
        setStatus(`${t(lang, 'status.webhid')} · ${t(lang, 'status.syncing')}`)
        setSaveStatus('idle')
        busyRef.current = true
        setBusyKind('connect')
        setDeviceBusy(true)

        setSavedDevices(
          rememberDevice({
            catalogId: catalog.id,
            brand: catalog.brand,
            model: catalog.model,
            vendorId: picked.vendorId,
            productId: picked.productId,
            productName: picked.productName,
          }),
        )

        void (async () => {
          try {
            if (useNative) {
              if (!d.attachNative) {
                throw new Error(`${catalog.model} driver missing attachNative`)
              }
              await d.attachNative({
                preferPid: picked.productId,
                device: picked,
              })
            } else {
              const transport = createWebHidTransport()
              await d.attach({
                ...transport,
                connect: () => transport.connectPreferred(picked.productId),
              })
              transport.onDisconnect(() => {
                umdLog('session', 'warn', 'device disconnected')
                publish(null)
                setTransportKind(null)
                setConnectingCatalogId(null)
                setStatus(t(uiLocale(), 'status.disconnected'))
                setSaveStatus('idle')
              })
            }
            if (driverRef.current !== d) return

            await d.probeFlashAndSync()
            if (driverRef.current !== d) return
            setState(cloneState(d.getState()))
            const bat = d.getState().info.batteryPercent
            const langSync = uiLocale(d.getState().settings.language)
            setStatus(
              d.lastVerifyNote ??
                `${t(langSync, 'status.webhid')}${
                  bat != null ? ` · ${bat}%` : ''
                }`,
            )
            umdLog('session', 'info', 'webhid synced', {
              catalogId: catalog.id,
              vendorId: picked.vendorId,
              productId: picked.productId,
              batteryPercent: bat,
              mouseReachable: d.mouseReachable,
              lastVerifyNote: d.lastVerifyNote,
            })
            await d.refreshFirmwareVersions()
            if (driverRef.current !== d) return
            setState(cloneState(d.getState()))
          } catch (err) {
            umdLog(
              'session',
              'error',
              'background sync failed',
              err instanceof Error ? err.message : String(err),
            )
            if (driverRef.current === d) {
              setStatus(
                err instanceof Error
                  ? err.message
                  : t(uiLocale(), 'status.webhidFailed'),
              )
            }
          } finally {
            if (driverRef.current === d) {
              busyRef.current = false
              setDeviceBusy(false)
              setBusyKind(null)
              setConnectingCatalogId(null)
            }
          }
        })()
        return catalog.id
      } catch (err) {
        busyRef.current = false
        setDeviceBusy(false)
        setBusyKind(null)
        setConnectingCatalogId(null)
        umdLog(
          'session',
          'error',
          'webhid connect failed',
          err instanceof Error ? err.message : String(err),
        )
        setStatus(
          err instanceof Error
            ? err.message
            : t(uiLocale(), 'status.webhidFailed'),
        )
        throw err
      }
    },
    [publish],
  )

  const disconnect = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    await driverRef.current?.detach()
    publish(null)
    setTransportKind(null)
    setConnectingCatalogId(null)
    setStatus(t(uiLocale(), 'status.disconnected'))
    setSaveStatus('idle')
  }, [publish])

  const value = useMemo<SessionValue>(
    () => ({
      connected: Boolean(driver),
      transportKind,
      status,
      saveStatus,
      deviceBusy,
      busyKind,
      connectingCatalogId,
      state,
      driver,
      webHidOk,
      savedDevices,
      connectMock,
      connectWebHid,
      disconnect,
      refreshSavedDevices,
      syncFromDriver,
      apply,
      refreshFromDevice,
    }),
    [
      driver,
      transportKind,
      status,
      saveStatus,
      deviceBusy,
      busyKind,
      connectingCatalogId,
      state,
      webHidOk,
      savedDevices,
      connectMock,
      connectWebHid,
      disconnect,
      refreshSavedDevices,
      syncFromDriver,
      apply,
      refreshFromDevice,
    ],
  )

  return (
    <DeviceSessionContext.Provider value={value}>
      {children}
    </DeviceSessionContext.Provider>
  )
}

export function useDeviceSession() {
  const ctx = useContext(DeviceSessionContext)
  if (!ctx) throw new Error('useDeviceSession outside provider')
  return ctx
}
