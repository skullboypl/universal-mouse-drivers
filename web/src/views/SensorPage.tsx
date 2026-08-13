'use client'

import { useEffect, type ReactNode } from 'react'
import { ClientRedirect } from '../components/ClientRedirect'
import { useLocale } from '../i18n/LocaleContext'
import { Select } from '../components/Select'
import { Toggle } from '../components/Toggle'
import styles from '../components/ui.module.css'
import {
  SUPERLIGHT_DPI_MAX,
  SUPERLIGHT_DPI_MAX_STAGES,
  SUPERLIGHT_DPI_MIN,
  SUPERLIGHT_DPI_STEP,
  SUPERLIGHT_REPORT_RATES,
  superlightDpiColor,
} from '../devices/mice/logitech/pro-x-superlight/defaults'
import { SUPERLIGHT_IDENTITY } from '../devices/mice/logitech/pro-x-superlight/identity'
import {
  DPI_MAX as BLITZ_DPI_MAX,
  DPI_MAX_STAGES as BLITZ_DPI_MAX_STAGES,
  DPI_MIN as BLITZ_DPI_MIN,
  DPI_STEP as BLITZ_DPI_STEP,
  REPORT_RATES as BLITZ_REPORT_RATES,
  dpiStageColor as blitzDpiStageColor,
} from '../devices/mice/rampage/blitz-ultimate/defaults'
import { BLITZ_ULTIMATE_IDENTITY } from '../devices/mice/rampage/blitz-ultimate/identity'
import {
  DPI_MAX as KING_DPI_MAX,
  DPI_MAX_STAGES as KING_DPI_MAX_STAGES,
  DPI_MIN as KING_DPI_MIN,
  DPI_STEP as KING_DPI_STEP,
  REPORT_RATES as KING_REPORT_RATES,
  dpiStageColor as kingDpiStageColor,
} from '../devices/mice/redragon/king-ultra/defaults'
import type { MessageKey } from '../i18n/messages'
import { useT } from '../i18n/useT'
import { useDeviceSession } from '../session/DeviceSessionContext'

function Tip({ text }: { text: string }) {
  return <p className={styles.fieldTip}>{text}</p>
}

function stageSwatch(index: number, mode: 'superlight' | 'blitz' | 'king'): string {
  if (mode === 'superlight') return superlightDpiColor(index)
  if (mode === 'blitz') return blitzDpiStageColor(index)
  return kingDpiStageColor(index)
}

function Field({
  label,
  tip,
  children,
}: {
  label: string
  tip: string
  children: ReactNode
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      <Tip text={tip} />
    </label>
  )
}

export function SensorPage() {
  const { connected, state, apply, driver, syncFromDriver, deviceBusy } =
    useDeviceSession()
  const { lp } = useLocale()
  const tr = useT()

  // DPI Loop / Polling Rate Switch on the mouse update flash — poll while this page is open.
  useEffect(() => {
    if (!connected || !driver?.refreshLiveSensorFromDevice) return
    let cancelled = false
    let inFlight = false

    const tick = async () => {
      if (cancelled || inFlight || deviceBusy) return
      inFlight = true
      try {
        const changed = await driver.refreshLiveSensorFromDevice?.()
        if (changed && !cancelled) syncFromDriver()
      } catch {
        /* ignore transient HID errors while polling */
      } finally {
        inFlight = false
      }
    }

    void tick()
    const id = window.setInterval(() => void tick(), 900)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [connected, driver, deviceBusy, syncFromDriver])

  if (!connected || !state) return <ClientRedirect href={lp('/')} />

  const isSuperlight = driver?.identity.id === SUPERLIGHT_IDENTITY.id
  const isBlitz = driver?.identity.id === BLITZ_ULTIMATE_IDENTITY.id
  const swatchMode: 'superlight' | 'blitz' | 'king' = isSuperlight
    ? 'superlight'
    : isBlitz
      ? 'blitz'
      : 'king'
  const dpiMin = isSuperlight
    ? SUPERLIGHT_DPI_MIN
    : isBlitz
      ? BLITZ_DPI_MIN
      : KING_DPI_MIN
  const dpiMax = isSuperlight
    ? SUPERLIGHT_DPI_MAX
    : isBlitz
      ? BLITZ_DPI_MAX
      : KING_DPI_MAX
  const dpiStep = isSuperlight
    ? SUPERLIGHT_DPI_STEP
    : isBlitz
      ? BLITZ_DPI_STEP
      : KING_DPI_STEP
  const dpiMaxStages = isSuperlight
    ? SUPERLIGHT_DPI_MAX_STAGES
    : isBlitz
      ? BLITZ_DPI_MAX_STAGES
      : KING_DPI_MAX_STAGES
  const reportRates = isSuperlight
    ? [...SUPERLIGHT_REPORT_RATES]
    : isBlitz
      ? [...BLITZ_REPORT_RATES]
      : [...KING_REPORT_RATES]

  const stage = state.sensor.dpiStages[state.sensor.activeDpiIndex]
  const cordedModeOk =
    state.sensor.reportRate >= 2000 || state.info.connection === 'corded'

  return (
    <div className="page">
      <h1 className="page-title">{tr('sensor.title')}</h1>
      <p className="page-sub">{tr('sensor.sub')}</p>

      <div className="panel">
        <h2 className="panel-label">{tr('sensor.dpiStages')}</h2>
        <div className="row" style={{ marginBottom: 14, gap: 20 }}>
          <Field label={tr('sensor.stageCount')} tip={tr('sensor.stageCountTip')}>
            <Select
              value={String(state.sensor.dpiStageCount ?? dpiMaxStages)}
              onChange={(e) => {
                void apply((d) => d.setDpiStageCount(Number(e.target.value)))
              }}
            >
              {Array.from({ length: dpiMaxStages }, (_, i) => i + 1).map(
                (n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ),
              )}
            </Select>
          </Field>
          <Field label={tr('sensor.activeStage')} tip={tr('sensor.activeStageTip')}>
            <Select
              value={String(state.sensor.activeDpiIndex)}
              onChange={(e) => {
                const idx = Number(e.target.value)
                void apply((d) => {
                  d.patchSensor({ activeDpiIndex: idx })
                  const s = d.getState().sensor.dpiStages[idx]
                  if (s) d.setDpiStage(idx, s.value)
                })
              }}
            >
              {state.sensor.dpiStages
                .filter((s) => s.enabled)
                .map((s) => (
                  <option key={s.index} value={String(s.index)}>
                    {s.index + 1} - {s.value}
                  </option>
                ))}
            </Select>
          </Field>
          <div
            className="mono"
            style={{
              marginLeft: 'auto',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--accent-hot)',
              alignSelf: 'end',
            }}
          >
            {stage?.value ?? '-'} DPI
          </div>
        </div>
        <Tip text={tr('sensor.dpiSliderTip')} />
        <div className="row" style={{ marginBottom: 12, gap: 6 }}>
          {state.sensor.dpiStages.map((s) => (
            <button
              key={s.index}
              type="button"
              disabled={!s.enabled}
              title={`${tr('sensor.stage')} ${s.index + 1}: ${s.value}`}
              onClick={() => {
                if (!s.enabled) return
                void apply((d) => {
                  d.patchSensor({ activeDpiIndex: s.index })
                  d.setDpiStage(s.index, s.value)
                })
              }}
              style={{
                width: 28,
                height: 10,
                borderRadius: 3,
                border:
                  s.index === state.sensor.activeDpiIndex
                    ? '1px solid rgba(232, 162, 58, 0.55)'
                    : '1px solid transparent',
                padding: 0,
                cursor: s.enabled ? 'pointer' : 'default',
                opacity: s.enabled
                  ? s.index === state.sensor.activeDpiIndex
                    ? 1
                    : 0.72
                  : 0.2,
                background:
                  s.index === state.sensor.activeDpiIndex
                    ? 'var(--accent)'
                    : stageSwatch(s.index, swatchMode),
                boxShadow:
                  s.index === state.sensor.activeDpiIndex
                    ? '0 0 0 1px rgba(10, 12, 16, 0.35)'
                    : undefined,
              }}
            />
          ))}
        </div>
        <div className={styles.sliderWrap}>
          <ButtonIcon
            label="−"
            onClick={() => {
              if (!stage) return
              void apply((d) =>
                d.setDpiStage(stage.index, stage.value - dpiStep),
              )
            }}
          />
          <input
            className={styles.slider}
            type="range"
            min={dpiMin}
            max={dpiMax}
            step={dpiStep}
            value={stage?.value ?? 800}
            onChange={(e) => {
              if (!stage) return
              const value = Number(e.target.value)
              void apply((d) => d.setDpiStage(stage.index, value))
            }}
          />
          <ButtonIcon
            label="+"
            onClick={() => {
              if (!stage) return
              void apply((d) =>
                d.setDpiStage(stage.index, stage.value + dpiStep),
              )
            }}
          />
          <input
            className="mono"
            style={{
              width: 96,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '0.45rem',
              textAlign: 'center',
            }}
            value={stage?.value ?? 800}
            onChange={(e) => {
              if (!stage) return
              const n = Number(e.target.value)
              if (!Number.isFinite(n)) return
              void apply((d) => d.setDpiStage(stage.index, n))
            }}
          />
        </div>
        <div
          style={{
            marginTop: 12,
            height: 4,
            background: 'var(--accent)',
            borderRadius: 2,
            width: `${Math.min(100, ((stage?.value ?? 0) / dpiMax) * 100)}%`,
          }}
        />
      </div>

      <div className="panel">
        <h2 className="panel-label">{tr('sensor.reportRate')}</h2>
        <Tip text={tr('sensor.reportRateTip')} />
        <div className={styles.chipRow}>
          {reportRates.map((hz) => (
            <button
              key={hz}
              type="button"
              className={
                state.sensor.reportRate === hz ? styles.chipActive : styles.chip
              }
              onClick={() => {
                void apply((d) => d.patchSensor({ reportRate: hz }))
              }}
            >
              {hz}Hz
            </button>
          ))}
        </div>
      </div>

      {!isSuperlight ? (
      <div className="panel">
        <h2 className="panel-label">{tr('sensor.sensorSetting')}</h2>
        <div className="grid-2">
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label={tr('sensor.mode')} tip={tr('sensor.modeTip')}>
              <Select
                value={state.sensor.mode}
                onChange={(e) => {
                  void apply((d) =>
                    d.patchSensor({
                      mode: e.target.value as typeof state.sensor.mode,
                    }),
                  )
                }}
              >
                <option value="lp">{tr('sensor.modeLp')}</option>
                <option value="hp">{tr('sensor.modeHp')}</option>
                <option value="corded" disabled={!cordedModeOk}>
                  {tr('sensor.modeCorded')}
                  {!cordedModeOk ? ` (${tr('sensor.modeCordedLocked')})` : ''}
                </option>
              </Select>
            </Field>
            <Field label={tr('sensor.lod')} tip={tr('sensor.lodTip')}>
              <Select
                value={String(state.sensor.lodMm)}
                onChange={(e) => {
                  void apply((d) =>
                    d.patchSensor({
                      lodMm: Number(e.target.value) as 0.7 | 1 | 2,
                    }),
                  )
                }}
              >
                <option value="0.7">0.7mm</option>
                <option value="1">1mm</option>
                <option value="2">2mm</option>
              </Select>
            </Field>
            <div>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={state.sensor.peakPerformance}
                  onChange={(e) => {
                    void apply((d) =>
                      d.patchSensor({ peakPerformance: e.target.checked }),
                    )
                  }}
                />
                {tr('sensor.peak')}
              </label>
              <Tip text={tr('sensor.peakTip')} />
            </div>
            <Field label={tr('sensor.peakTimeout')} tip={tr('sensor.peakTimeoutTip')}>
              <Select
                value={String(state.sensor.peakPerformanceTimeoutMin)}
                disabled={!state.sensor.peakPerformance}
                onChange={(e) => {
                  void apply((d) =>
                    d.patchSensor({
                      peakPerformanceTimeoutMin: Number(e.target.value),
                    }),
                  )
                }}
              >
                {[0.5, 1, 2, 5, 10, 15].map((m) => (
                  <option key={m} value={String(m)}>
                    {m < 1 ? tr('sensor.sec30') : `${m} ${tr('sensor.min')}`}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            {(
              [
                ['sensor.ripple', 'sensor.rippleTip', 'rippleControl'],
                ['sensor.angle', 'sensor.angleTip', 'angleSnapping'],
                ['sensor.motion', 'sensor.motionTip', 'motionSync'],
              ] as Array<
                [MessageKey, MessageKey, 'rippleControl' | 'angleSnapping' | 'motionSync']
              >
            ).map(([labelKey, tipKey, field]) => (
              <div key={field}>
                <Toggle
                  label={tr(labelKey)}
                  on={state.sensor[field]}
                  onChange={(on) => {
                    void apply((d) => d.patchSensor({ [field]: on }))
                  }}
                />
                <Tip text={tr(tipKey)} />
              </div>
            ))}
          </div>
        </div>
      </div>
      ) : null}
    </div>
  )
}

function ButtonIcon({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--accent)',
        color: 'white',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
