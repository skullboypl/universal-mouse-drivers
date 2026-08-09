'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { umdLog } from '../debug/umdLog'
import { createDriver, findCatalogDevice } from '../devices/registry'
import { KING_ULTRA_IDENTITY } from '../devices/redragon-king-ultra/identity'
import type { KingUltraDriver } from '../devices/redragon-king-ultra/driver'
import type { DeviceState } from '../devices/types'
import { t } from '../i18n/messages'
import { normalizeLocale, readStoredLocale, type Locale } from '../i18n/locale'
import { createMockTransport } from '../transport/mock'
import { createWebHidTransport, webHidSupported } from '../transport/webhid'
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
  state: DeviceState | null
  driver: KingUltraDriver | null
  webHidOk: boolean
  savedDevices: SavedDevice[]
  connectMock: () => Promise<void>
  connectWebHid: (productId?: number) => Promise<void>
  disconnect: () => Promise<void>
  refreshSavedDevices: () => void
  syncFromDriver: () => void
  apply: (fn: (driver: KingUltraDriver) => void | Promise<void>) => Promise<void>
}

const DeviceSessionContext = createContext<SessionValue | null>(null)
const AUTOSAVE_MS = 450

function cloneState(state: DeviceState): DeviceState {
  return structuredClone(state)
}

function uiLocale(raw?: string | null): Locale {
  return normalizeLocale(raw) ?? readStoredLocale() ?? 'pl'
}

function mergeDraft(driver: KingUltraDriver) {
  const draft = loadSavedDraft()
  if (!draft) return
  try {
    driver.importProfile(
      JSON.stringify({
        device: KING_ULTRA_IDENTITY.id,
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
  const [driver, setDriver] = useState<KingUltraDriver | null>(null)
  const [transportKind, setTransportKind] = useState<TransportKind | null>(null)
  const [state, setState] = useState<DeviceState | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [savedDevices, setSavedDevices] = useState<SavedDevice[]>(() =>
    loadSavedDevices(),
  )
  const driverRef = useRef<KingUltraDriver | null>(null)
  const transportKindRef = useRef<TransportKind | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const publish = useCallback((d: KingUltraDriver | null) => {
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
      try {
        const snap = cloneState(current.getState())
        persistDraft(snap)
        void current.flushToDevice()
        setSaveStatus('saved')
        const lang = uiLocale(snap.settings.language)
        const kind = transportKindRef.current
        setStatus(
          `${t(lang, kind === 'webhid' ? 'status.webhid' : 'status.mock')} · ${t(lang, 'status.saved')}`,
        )
      } catch {
        setSaveStatus('error')
      }
    }, AUTOSAVE_MS)
  }, [])

  const syncFromDriver = useCallback(() => {
    const d = driverRef.current
    setState(d ? cloneState(d.getState()) : null)
  }, [])

  const apply = useCallback(
    async (fn: (driver: KingUltraDriver) => void | Promise<void>) => {
      const d = driverRef.current
      if (!d) return
      try {
        // Sensor/DPI writers are sync + debounced - do not block the slider on HID.
        const result = fn(d)
        setState(cloneState(d.getState()))
        scheduleAutoSave()
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

  const connectMock = useCallback(async () => {
    const lang0 = uiLocale()
    setStatus(t(lang0, 'status.connectingDemo'))
    const d = createDriver(KING_ULTRA_IDENTITY.id)
    const transport = createMockTransport()
    await d.attach(transport)
    mergeDraft(d)
    d.applyDemoSkin()
    d.patchSettings({ language: uiLocale() })
    transportKindRef.current = 'mock'
    setTransportKind('mock')
    publish(d)
    const lang = uiLocale(d.getState().settings.language)
    setStatus(t(lang, 'status.mock'))
    setSaveStatus('idle')
  }, [publish])

  const connectWebHid = useCallback(
    async (productId?: number) => {
      const lang0 = uiLocale()
      setStatus(t(lang0, 'status.selectMouse'))
      const d = createDriver(KING_ULTRA_IDENTITY.id)
      const transport = createWebHidTransport()
      try {
        await d.attach({
          ...transport,
          connect: () => transport.connectPreferred(productId),
        })
        const info = transport.getDeviceInfo()
        if (info) {
          const catalog =
            findCatalogDevice(info.vendorId, info.productId) ??
            KING_ULTRA_IDENTITY
          setSavedDevices(
            rememberDevice({
              catalogId: catalog.id,
              brand: catalog.brand,
              model: catalog.model,
              vendorId: info.vendorId,
              productId: info.productId,
              productName: info.productName,
            }),
          )
        }
        mergeDraft(d)
        d.patchSettings({ language: uiLocale() })
        // Open UI immediately - flash map + FW sync in background.
        transportKindRef.current = 'webhid'
        setTransportKind('webhid')
        publish(d)
        const lang = uiLocale(d.getState().settings.language)
        const bat0 = d.getState().info.batteryPercent
        setStatus(
          `${t(lang, 'status.webhid')}${
            bat0 != null ? ` · ${bat0}%` : ''
          } · ${t(lang, 'status.syncing')}`,
        )
        setSaveStatus('idle')
        transport.onDisconnect(() => {
          umdLog('session', 'warn', 'device disconnected')
          publish(null)
          setTransportKind(null)
          setStatus(t(uiLocale(), 'status.disconnected'))
          setSaveStatus('idle')
        })

        void (async () => {
          try {
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
            umdLog('session', 'info', 'webhid flash synced', {
              info: transport.getDeviceInfo(),
              batteryPercent: bat,
              mouseReachable: d.mouseReachable,
              lastVerifyNote: d.lastVerifyNote,
              build: 'i18n-pl-en-v12',
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
          }
        })()
      } catch (err) {
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
    setStatus(t(uiLocale(), 'status.disconnected'))
    setSaveStatus('idle')
  }, [publish])

  const value = useMemo<SessionValue>(
    () => ({
      connected: Boolean(driver),
      transportKind,
      status,
      saveStatus,
      state,
      driver,
      webHidOk: webHidSupported(),
      savedDevices,
      connectMock,
      connectWebHid,
      disconnect,
      refreshSavedDevices,
      syncFromDriver,
      apply,
    }),
    [
      driver,
      transportKind,
      status,
      saveStatus,
      state,
      savedDevices,
      connectMock,
      connectWebHid,
      disconnect,
      refreshSavedDevices,
      syncFromDriver,
      apply,
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
