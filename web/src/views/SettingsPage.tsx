'use client'

import { useEffect } from 'react'
import { ClientRedirect } from '../components/ClientRedirect'
import { Button } from '../components/Button'
import { Select } from '../components/Select'
import styles from '../components/ui.module.css'
import { useLocale } from '../i18n/LocaleContext'
import { LOCALES, type Locale } from '../i18n/locale'
import { useT } from '../i18n/useT'
import { useDeviceSession } from '../session/DeviceSessionContext'

export function SettingsPage() {
  const { connected, state, apply, syncFromDriver } = useDeviceSession()
  const { locale, setLocale, lp } = useLocale()
  const tr = useT()

  useEffect(() => {
    if (!connected) return
    void apply(async (d) => {
      await d.refreshFirmwareVersions()
      await d.refreshSleepFromDevice()
      syncFromDriver()
    })
  }, [connected, apply, syncFromDriver])

  if (!connected || !state) return <ClientRedirect href={lp('/')} />

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
              await d.refreshSleepFromDevice()
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

      <div className="panel">
        <h2 className="panel-label">{tr('settings.sleep')}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {tr('settings.sleepHint')}
        </p>
        <Select
          value={String(state.settings.sleepAfterMin)}
          onChange={(e) => {
            void apply((d) =>
              d.patchSettings({ sleepAfterMin: Number(e.target.value) }),
            )
          }}
        >
          {[1, 2, 5, 10, 15, 30].map((m) => (
            <option key={m} value={String(m)}>
              {tr('settings.sleepMin', { n: m })}
            </option>
          ))}
        </Select>
      </div>

      <div className="panel">
        <h2 className="panel-label">{tr('settings.other')}</h2>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={state.settings.runOnBoot}
            onChange={(e) => {
              void apply((d) =>
                d.patchSettings({ runOnBoot: e.target.checked }),
              )
            }}
          />
          {tr('settings.boot')}
        </label>
        <p style={{ marginTop: 14 }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              window.alert(tr('settings.winMouseAlert'))
            }}
          >
            {tr('settings.winMouse')}
          </a>
        </p>
      </div>

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
    </div>
  )
}
