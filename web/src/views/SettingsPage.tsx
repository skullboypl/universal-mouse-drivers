'use client'

import { useEffect, useState } from 'react'
import { ClientRedirect } from '../components/ClientRedirect'
import { Button } from '../components/Button'
import { Select } from '../components/Select'
import styles from '../components/ui.module.css'
import { FENRIR_MAX_IDENTITY } from '../devices/gwolves-fenrir-max/identity'
import {
  clampFenrirSleepSec,
  FENRIR_SLEEP_MAX_SEC,
  FENRIR_SLEEP_MIN_SEC,
  FENRIR_SLEEP_STEP_SEC,
  formatFenrirSleep,
  resolveFenrirSleepSec,
} from '../devices/gwolves-fenrir-max/sleep'
import { useLocale } from '../i18n/LocaleContext'
import { LOCALES, type Locale } from '../i18n/locale'
import { useT } from '../i18n/useT'
import { useDeviceSession } from '../session/DeviceSessionContext'
import {
  fetchTrayStatus,
  openWindowsMouseProps,
  setTrayStartup,
  type TrayBridgeStatus,
} from '../lib/trayBridge'
import {
  sleepCodeToMinutes,
  sleepMinutesToCode,
} from '../devices/redragon-king-ultra/protocol'

/** OEM customComboBox_PowerSaveTime → allLedOffTime @ 0xAD (10s units). */
const SLEEP_OPTIONS: { code: number; kind: 'sec' | 'min'; n: number }[] = [
  { code: 1, kind: 'sec', n: 10 },
  { code: 3, kind: 'sec', n: 30 },
  { code: 6, kind: 'min', n: 1 },
  { code: 18, kind: 'min', n: 3 },
  { code: 30, kind: 'min', n: 5 },
  { code: 60, kind: 'min', n: 10 },
  { code: 90, kind: 'min', n: 15 },
  { code: 120, kind: 'min', n: 20 },
  { code: 150, kind: 'min', n: 25 },
  { code: 180, kind: 'min', n: 30 },
  { code: 210, kind: 'min', n: 35 },
  { code: 240, kind: 'min', n: 40 },
]

export function SettingsPage() {
  const { connected, state, driver, apply, syncFromDriver } = useDeviceSession()
  const { locale, setLocale, lp } = useLocale()
  const tr = useT()
  const isFenrir = driver?.identity.id === FENRIR_MAX_IDENTITY.id
  const [tray, setTray] = useState<TrayBridgeStatus | null>(null)
  const [trayBusy, setTrayBusy] = useState(false)

  useEffect(() => {
    if (!connected) return
    void apply(async (d) => {
      await d.refreshFirmwareVersions()
      await d.refreshSleepFromDevice?.()
      syncFromDriver()
    })
  }, [connected, apply, syncFromDriver])

  useEffect(() => {
    if (!connected) return
    let cancelled = false
    async function poll() {
      const status = await fetchTrayStatus()
      if (!cancelled) setTray(status)
    }
    void poll()
    const id = window.setInterval(() => void poll(), 2000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [connected])

  if (!connected || !state) return <ClientRedirect href={lp('/')} />

  const trayOnline = Boolean(tray?.running)
  const runAtStartup = Boolean(tray?.runAtStartup)

  return (
    <div className="page">
      <h1 className="page-title">{tr('settings.title')}</h1>
      <p className="page-sub">
        {tr('settings.driveVer', { v: state.info.driveVersion })}
      </p>

      <div className="panel">
        <h2 className="panel-label">{tr('settings.language')}</h2>
        <Select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          {LOCALES.map((code) => (
            <option key={code} value={code}>
              {code === 'pl' ? tr('settings.langPl') : tr('settings.langEn')}
            </option>
          ))}
        </Select>
      </div>

      <div className="panel">
        <h2 className="panel-label">{tr('settings.deviceInfo')}</h2>
        <p className="mono muted" style={{ margin: '0 0 6px' }}>
          {tr('settings.receiverFw')} {state.info.receiverFirmware}
        </p>
        <p className="mono muted" style={{ margin: '0 0 10px' }}>
          {tr('settings.mouseFw')} {state.info.mouseFirmware}
        </p>
        <Button
          onClick={() => {
            void apply(async (d) => {
              await d.refreshFirmwareVersions()
              await d.refreshSleepFromDevice?.()
              syncFromDriver()
            })
          }}
        >
          {tr('settings.refreshFw')}
        </Button>
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 0 }}>
          {tr('settings.fwHint')}
        </p>
      </div>

      {!isFenrir ? (
        <div className="panel">
          <h2 className="panel-label">{tr('settings.pairing')}</h2>
          <Button
            onClick={() => {
              window.alert(tr('settings.pairAlert'))
            }}
          >
            {tr('settings.pair')}
          </Button>
        </div>
      ) : null}

      <div className="panel">
        <h2 className="panel-label">{tr('settings.sleep')}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {tr('settings.sleepHint')}
        </p>
        {isFenrir ? (
          <label
            className="row"
            style={{ gap: 12, alignItems: 'center', width: '100%' }}
          >
            <input
              type="range"
              min={FENRIR_SLEEP_MIN_SEC}
              max={FENRIR_SLEEP_MAX_SEC}
              step={FENRIR_SLEEP_STEP_SEC}
              value={resolveFenrirSleepSec(state.settings)}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
              onChange={(e) => {
                const sec = clampFenrirSleepSec(Number(e.target.value))
                void apply(async (d) => {
                  await d.patchSettings({ sleepAfterSec: sec })
                  syncFromDriver()
                })
              }}
            />
            <span className="mono" style={{ minWidth: '5.5rem' }}>
              {formatFenrirSleep(resolveFenrirSleepSec(state.settings))}
            </span>
          </label>
        ) : (
          <Select
            value={String(sleepMinutesToCode(state.settings.sleepAfterMin))}
            onChange={(e) => {
              const code = Number(e.target.value)
              const minutes = sleepCodeToMinutes(code)
              void apply(async (d) => {
                await d.patchSettings({ sleepAfterMin: minutes })
                syncFromDriver()
              })
            }}
          >
            {SLEEP_OPTIONS.map((opt) => (
              <option key={opt.code} value={String(opt.code)}>
                {opt.kind === 'sec'
                  ? tr('settings.sleepSec', { n: opt.n })
                  : tr('settings.sleepMin', { n: opt.n })}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="panel">
        <h2 className="panel-label">{tr('settings.other')}</h2>
        <p className="mono muted" style={{ marginTop: 0 }}>
          {trayOnline
            ? tr('settings.trayOnline', {
                v: tray?.version ?? '?',
                n:
                  tray?.batteryPercent != null
                    ? String(tray.batteryPercent)
                    : '—',
              })
            : tr('settings.trayOffline')}
        </p>

        <label
          className={styles.check}
          style={{ opacity: trayOnline ? 1 : 0.45 }}
        >
          <input
            type="checkbox"
            disabled={!trayOnline || trayBusy}
            checked={trayOnline ? runAtStartup : false}
            onChange={(e) => {
              const enabled = e.target.checked
              setTrayBusy(true)
              void setTrayStartup(enabled)
                .then((ok) => {
                  if (ok) {
                    setTray((prev) =>
                      prev ? { ...prev, runAtStartup: enabled } : prev,
                    )
                    void apply((d) => d.patchSettings({ runOnBoot: enabled }))
                  }
                })
                .finally(() => setTrayBusy(false))
            }}
          />
          {tr('settings.boot')}
        </label>

        {!trayOnline && (
          <p style={{ marginTop: 10, marginBottom: 0 }}>
            <a href="/api/downloads/UmdBatteryTray.exe">
              {tr('settings.trayDownloadRun')}
            </a>
          </p>
        )}

        <p style={{ marginTop: 14, marginBottom: 0 }}>
          <a href="https://mouse.vxh.pl" target="_blank" rel="noreferrer">
            {tr('settings.mouseSite')}
          </a>
        </p>

        <p style={{ marginTop: 10, marginBottom: 0 }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (!trayOnline) {
                window.alert(tr('settings.winMouseAlert'))
                return
              }
              void openWindowsMouseProps().then((ok) => {
                if (!ok) window.alert(tr('settings.winMouseAlert'))
              })
            }}
          >
            {tr('settings.winMouse')}
          </a>
        </p>
      </div>

      {!isFenrir ? (
        <div className="panel">
          <h2 className="panel-label">{tr('settings.advanced')}</h2>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={state.settings.longDistance}
              onChange={(e) => {
                void apply((d) =>
                  d.patchSettings({ longDistance: e.target.checked }),
                )
              }}
            />
            {tr('settings.longDistance')}
          </label>
          <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 0 }}>
            {tr('settings.longDistanceTip')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
