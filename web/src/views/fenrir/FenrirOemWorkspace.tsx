import { useEffect, useMemo, useState } from 'react'
import { ClientRedirect } from '../../components/ClientRedirect'
import { FieldBusy } from '../../components/FieldBusy'
import { Toggle } from '../../components/Toggle'
import type { ButtonAction } from '../../devices/types'
import { FENRIR_MAX_ART } from '../../devices/mice/gwolves/fenrir-max/buttons'
import {
  FENRIR_DPI_MAX,
  FENRIR_DPI_MAX_STAGES,
  FENRIR_DPI_MIN,
  FENRIR_DPI_STEP,
  FENRIR_REPORT_RATES,
} from '../../devices/mice/gwolves/fenrir-max/defaults'
import {
  FENRIR_CLICK_DEBOUNCE_LEVELS,
  FENRIR_CLICK_DEBOUNCE_MAX,
  FENRIR_WHEEL_DEBOUNCE_MAX,
  FENRIR_WHEEL_DEBOUNCE_PRESETS,
  fenrirClickQuadFromLevel,
} from '../../devices/mice/gwolves/fenrir-max/debounce'
import { FENRIR_OEM, fenrirDpiColor } from '../../devices/mice/gwolves/fenrir-max/theme'
import {
  clampFenrirSleepSec,
  FENRIR_SLEEP_MAX_SEC,
  FENRIR_SLEEP_MIN_SEC,
  FENRIR_SLEEP_STEP_SEC,
  formatFenrirSleep,
  resolveFenrirSleepSec,
} from '../../devices/mice/gwolves/fenrir-max/sleep'
import { useLocale } from '../../i18n/LocaleContext'
import type { MessageKey } from '../../i18n/messages'
import { useT } from '../../i18n/useT'
import { useDeviceSession } from '../../session/DeviceSessionContext'
import { useFieldLoading } from '../../session/useFieldLoading'
import css from './FenrirOemWorkspace.module.css'

const ACTIONS: { value: ButtonAction; key: MessageKey }[] = [
  { value: 'left', key: 'buttons.action.left' },
  { value: 'right', key: 'buttons.action.right' },
  { value: 'middle', key: 'buttons.action.middle' },
  { value: 'forward', key: 'buttons.action.forward' },
  { value: 'back', key: 'buttons.action.back' },
  { value: 'dpi_cycle', key: 'buttons.action.dpi_cycle' },
  { value: 'disabled', key: 'buttons.action.disabled' },
  { value: 'macro', key: 'buttons.action.macro' },
]

const LOD_OPTS = [
  { mm: 0.7 as const, label: 'Low' },
  { mm: 1 as const, label: 'Middle' },
  { mm: 2 as const, label: 'High' },
]

type BadgePos = { id: number; uiX: number; uiY: number }

/**
 * Single-page OEM DriverCore layout (mouse.xyz Fenir):
 * Key Set | Device + Competitive | Para Set
 * DPI Set (LED · Axis Sync · Level · X · Y)
 */
export function FenrirOemWorkspace() {
  const { connected, state, driver, apply, disconnect, refreshFromDevice } =
    useDeviceSession()
  const { lp } = useLocale()
  const tr = useT()
  const { touch, busy } = useFieldLoading()
  const [focusId, setFocusId] = useState<number | null>(1)
  const [layout, setLayout] = useState<BadgePos[] | null>(null)
  /** OEM click level slider: preview while dragging, commit on pointerup. */
  const [clickLevelDrag, setClickLevelDrag] = useState<number | null>(null)
  /** OEM wheel level slider: same drag/commit pattern. */
  const [wheelLevelDrag, setWheelLevelDrag] = useState<number | null>(null)

  useEffect(() => {
    if (!connected || !driver) return
    let cancelled = false
    void fetch('/api/buttons?layoutId=fenrir-max')
      .then((r) => r.json())
      .then((data: { positions?: BadgePos[] }) => {
        if (!cancelled && Array.isArray(data.positions)) setLayout(data.positions)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [connected, driver])

  const posById = useMemo(() => {
    const m = new Map<number, BadgePos>()
    for (const p of layout ?? []) m.set(p.id, p)
    return m
  }, [layout])

  if (!connected || !state || !driver) {
    return <ClientRedirect href={lp('/')} />
  }

  const wired = state.info.connection === 'corded'
  const linkIcon = wired ? FENRIR_OEM.assets.wired : FENRIR_OEM.assets.wireless
  const sync = state.sensor.dpiAxisSync !== false
  const stage = state.sensor.dpiStages[state.sensor.activeDpiIndex]
  const dpiX = stage?.value ?? 800
  const dpiY = stage?.valueY ?? dpiX
  const rates = FENRIR_REPORT_RATES.filter((hz) => {
    if (state.info.connection === 'corded') return hz <= 1000
    return true
  })
  const clickLevel = clickLevelDrag ?? state.sensor.debounceLevel ?? 0
  const clickDiyOn = Boolean(state.sensor.debounceEnabled)
  const clickQuadPreview =
    clickLevelDrag != null
      ? fenrirClickQuadFromLevel(clickLevelDrag)
      : null
  const clickDiyRows = [
    {
      key: 'debounceBeforePress' as const,
      label: 'Before Press',
      value:
        clickQuadPreview?.beforePress ??
        state.sensor.debounceBeforePress ??
        state.sensor.debounceMs,
    },
    {
      key: 'debounceBeforeRelease' as const,
      label: 'Before Release',
      value:
        clickQuadPreview?.beforeRelease ??
        state.sensor.debounceBeforeRelease ??
        5,
    },
    {
      key: 'debounceAfterPress' as const,
      label: 'After Press',
      value:
        clickQuadPreview?.afterPress ?? state.sensor.debounceAfterPress ?? 35,
    },
    {
      key: 'debounceAfterRelease' as const,
      label: 'After Release',
      value:
        clickQuadPreview?.afterRelease ??
        state.sensor.debounceAfterRelease ??
        10,
    },
  ]
  const wheelDiyOn = Boolean(state.sensor.wheelDebounceDiy)
  const wheelLevel = wheelLevelDrag ?? state.sensor.wheelDebounceLevel ?? 0
  const wheelMsPreview =
    wheelLevelDrag != null
      ? FENRIR_WHEEL_DEBOUNCE_PRESETS[wheelLevelDrag]!
      : null
  const wheelDiyMs = wheelMsPreview ?? state.sensor.wheelDebounceMs ?? 8

  const commitClickLevel = (level: number) => {
    setClickLevelDrag(null)
    touch('clickDebounce')
    if (clickDiyOn) {
      // While DIY is on, level slider selects a preset into the 4 fields (A-F).
      const quad = fenrirClickQuadFromLevel(level)
      void apply((d) =>
        d.patchSensor({
          debounceEnabled: true,
          debounceLevel: level,
          debounceBeforePress: quad.beforePress,
          debounceBeforeRelease: quad.beforeRelease,
          debounceAfterPress: quad.afterPress,
          debounceAfterRelease: quad.afterRelease,
          debounceMs: quad.beforePress,
        }),
      )
      return
    }
    // OEM et(): DIY already off - apply preset only.
    void apply((d) =>
      d.patchSensor({
        debounceEnabled: false,
        debounceLevel: level,
      }),
    )
  }

  const commitWheelLevel = (level: number) => {
    setWheelLevelDrag(null)
    const ms = FENRIR_WHEEL_DEBOUNCE_PRESETS[level]!
    touch('wheelDebounce')
    if (wheelDiyOn) {
      // DIY stays on: browse wheel presets into Wheel DebounceDIY(Xms).
      void apply((d) =>
        d.patchSensor({
          wheelDebounceDiy: true,
          wheelDebounceLevel: level,
          wheelDebounceMs: ms,
        }),
      )
      return
    }
    void apply((d) =>
      d.patchSensor({
        wheelDebounceDiy: false,
        wheelDebounceLevel: level,
        wheelDebounceMs: ms,
      }),
    )
  }

  const setDpiX = (x: number) => {
    if (!stage) return
    touch('dpi')
    void apply((d) => d.setDpiStage(stage.index, x, sync ? x : dpiY))
  }
  const setDpiY = (y: number) => {
    if (!stage) return
    touch('dpi')
    void apply((d) => d.setDpiStage(stage.index, sync ? y : dpiX, y))
  }

  return (
    <div className={css.page}>
      <div className={css.topGrid}>
        {/* Key Set */}
        <section className={css.panel}>
          <h2 className={css.panelTitle}>Key Settings</h2>
          <div className={css.keyList}>
            {state.buttons.map((b) => (
              <FieldBusy key={b.id} busy={busy(`btn-${b.id}`)} className={css.keyRow}>
                <button
                  type="button"
                  className={`${css.keyBtn} ${
                    focusId === b.id ? css.keyBtnActive : ''
                  }`}
                  onClick={() => setFocusId(b.id)}
                >
                  {b.id}. {b.label}
                </button>
                <select
                  className={css.select}
                  value={b.action}
                  onChange={(e) => {
                    setFocusId(b.id)
                    touch(`btn-${b.id}`)
                    void apply((d) =>
                      d.setButtonAction(b.id, e.target.value as ButtonAction),
                    )
                  }}
                  onFocus={() => setFocusId(b.id)}
                >
                  {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {tr(a.key)}
                    </option>
                  ))}
                </select>
              </FieldBusy>
            ))}
          </div>
        </section>

        {/* Center device */}
        <section className={css.center}>
          <div className={css.linkMeta}>
            <img className={css.linkIcon} src={linkIcon} alt="" width={22} height={22} />
            <span>
              {wired ? 'Wired' : 'Wireless 8K'}
              {state.info.batteryPercent != null
                ? ` · ${state.info.batteryPercent}%`
                : ''}
            </span>
          </div>
          <div
            className={css.deviceWrap}
            style={{
              aspectRatio: `${FENRIR_MAX_ART.width} / ${FENRIR_MAX_ART.height}`,
            }}
          >
            <img
              className={css.deviceImg}
              src={FENRIR_OEM.assets.device}
              alt={driver.identity.model}
              width={FENRIR_MAX_ART.width}
              height={FENRIR_MAX_ART.height}
              draggable={false}
            />
            {state.buttons.map((b) => {
              const pos = posById.get(b.id)
              const uiX = pos?.uiX ?? b.uiX
              const uiY = pos?.uiY ?? b.uiY
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`${css.badge} ${
                    focusId === b.id ? css.badgeActive : ''
                  }`}
                  style={{
                    left: `${(uiX / FENRIR_MAX_ART.width) * 100}%`,
                    top: `${(uiY / FENRIR_MAX_ART.height) * 100}%`,
                  }}
                  title={`${b.id}. ${b.label}`}
                  onClick={() => setFocusId(b.id)}
                >
                  {b.id}
                </button>
              )
            })}
          </div>
          <p className={css.deviceName}>
            {driver.identity.brand} {driver.identity.model}
          </p>
          <div className={css.toolRow}>
            <button
              type="button"
              className={css.toolBtn}
              onClick={() => void disconnect()}
            >
              Disconnect
            </button>
            <button
              type="button"
              className={css.toolBtn}
              onClick={() => void refreshFromDevice()}
            >
              Refresh
            </button>
            <button
              type="button"
              className={css.toolBtn}
              onClick={() => void apply((d) => d.restoreDefaults())}
            >
              Reset
            </button>
          </div>
          <FieldBusy busy={busy('competitive')} className={css.competitive}>
            <Toggle
              label="Competitive Mode"
              on={Boolean(state.sensor.peakPerformance)}
              onChange={(next) => {
                touch('competitive')
                void apply((d) => d.patchSensor({ peakPerformance: next }))
              }}
            />
          </FieldBusy>
        </section>

        {/* Parameter Settings */}
        <section className={css.panel}>
          <h2 className={css.panelTitle}>Parameter Settings</h2>

          <FieldBusy busy={busy('clickDebounce')} className={css.paraBlock}>
            <div className={css.debRow}>
              <div className={css.debMain}>
                <span className={css.paraLabel}>
                  Click Debounce
                  <span className={css.levelHint}>
                    {' '}
                    · L{clickLevel + 1}
                  </span>
                </span>
                <input
                  className={css.slider}
                  type="range"
                  min={0}
                  max={FENRIR_CLICK_DEBOUNCE_LEVELS.length - 1}
                  step={1}
                  value={clickLevel}
                  title={`Level ${clickLevel + 1}`}
                  onChange={(e) => {
                    // OEM: only update thumb while dragging; write on pointerup.
                    setClickLevelDrag(Number(e.target.value))
                  }}
                  onPointerUp={(e) => {
                    commitClickLevel(Number((e.target as HTMLInputElement).value))
                  }}
                  onKeyUp={(e) => {
                    if (
                      e.key === 'ArrowLeft' ||
                      e.key === 'ArrowRight' ||
                      e.key === 'Home' ||
                      e.key === 'End'
                    ) {
                      commitClickLevel(
                        Number((e.target as HTMLInputElement).value),
                      )
                    }
                  }}
                />
              </div>
              <button
                type="button"
                className={clickDiyOn ? css.diyOn : css.diy}
                aria-pressed={clickDiyOn}
                aria-label="Click Debounce DIY"
                onClick={() => {
                  const next = !clickDiyOn
                  setClickLevelDrag(null)
                  touch('clickDebounce')
                  void apply((d) =>
                    d.patchSensor({
                      debounceEnabled: next,
                      debounceLevel: state.sensor.debounceLevel ?? 0,
                    }),
                  )
                }}
              >
                DIY
              </button>
            </div>
            {clickDiyOn ? (
              <div className={css.diyStack}>
                {clickDiyRows.map((row) => (
                  <div key={row.key} className={css.diyField}>
                    <span className={css.paraLabel}>
                      {row.label}({row.value}ms)
                    </span>
                    <input
                      className={css.slider}
                      type="range"
                      min={0}
                      max={FENRIR_CLICK_DEBOUNCE_MAX}
                      step={1}
                      value={Math.min(FENRIR_CLICK_DEBOUNCE_MAX, row.value)}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setClickLevelDrag(null)
                        touch('clickDebounce')
                        void apply((d) =>
                          d.patchSensor({
                            debounceEnabled: true,
                            [row.key]: v,
                            ...(row.key === 'debounceBeforePress'
                              ? { debounceMs: v }
                              : {}),
                          }),
                        )
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </FieldBusy>

          <FieldBusy busy={busy('wheelDebounce')} className={css.paraBlock}>
            <div className={css.debRow}>
              <div className={css.debMain}>
                <span className={css.paraLabel}>
                  Wheel Debounce
                  <span className={css.levelHint}>
                    {' '}
                    · L{wheelLevel + 1}
                  </span>
                </span>
                <input
                  className={css.slider}
                  type="range"
                  min={0}
                  max={FENRIR_WHEEL_DEBOUNCE_PRESETS.length - 1}
                  step={1}
                  value={wheelLevel}
                  title={`Level ${wheelLevel + 1} · ${FENRIR_WHEEL_DEBOUNCE_PRESETS[wheelLevel]}ms`}
                  onChange={(e) => {
                    setWheelLevelDrag(Number(e.target.value))
                  }}
                  onPointerUp={(e) => {
                    commitWheelLevel(
                      Number((e.target as HTMLInputElement).value),
                    )
                  }}
                  onKeyUp={(e) => {
                    if (
                      e.key === 'ArrowLeft' ||
                      e.key === 'ArrowRight' ||
                      e.key === 'Home' ||
                      e.key === 'End'
                    ) {
                      commitWheelLevel(
                        Number((e.target as HTMLInputElement).value),
                      )
                    }
                  }}
                />
              </div>
              <button
                type="button"
                className={wheelDiyOn ? css.diyOn : css.diy}
                aria-pressed={wheelDiyOn}
                aria-label="Wheel Debounce DIY"
                onClick={() => {
                  const next = !wheelDiyOn
                  setWheelLevelDrag(null)
                  touch('wheelDebounce')
                  if (next) {
                    void apply((d) =>
                      d.patchSensor({
                        wheelDebounceDiy: true,
                        wheelDebounceMs: state.sensor.wheelDebounceMs ?? 8,
                      }),
                    )
                  } else {
                    const level = state.sensor.wheelDebounceLevel ?? 0
                    void apply((d) =>
                      d.patchSensor({
                        wheelDebounceDiy: false,
                        wheelDebounceLevel: level,
                        wheelDebounceMs: FENRIR_WHEEL_DEBOUNCE_PRESETS[level]!,
                      }),
                    )
                  }
                }}
              >
                DIY
              </button>
            </div>
            {wheelDiyOn ? (
              <div className={css.diyField}>
                <span className={css.paraLabel}>
                  Wheel DebounceDIY({wheelDiyMs}ms)
                </span>
                <input
                  className={css.slider}
                  type="range"
                  min={0}
                  max={FENRIR_WHEEL_DEBOUNCE_MAX}
                  step={1}
                  value={Math.min(FENRIR_WHEEL_DEBOUNCE_MAX, wheelDiyMs)}
                  onChange={(e) => {
                    setWheelLevelDrag(null)
                    touch('wheelDebounce')
                    void apply((d) =>
                      d.patchSensor({
                        wheelDebounceDiy: true,
                        wheelDebounceMs: Number(e.target.value),
                      }),
                    )
                  }}
                />
              </div>
            ) : null}
          </FieldBusy>

          <FieldBusy busy={busy('poll')} className={css.paraBlock}>
            <span className={css.paraLabel}>
              Polling Rate ({state.sensor.reportRate}Hz)
            </span>
            <input
              className={css.slider}
              type="range"
              min={0}
              max={Math.max(0, rates.length - 1)}
              step={1}
              value={Math.max(0, rates.indexOf(state.sensor.reportRate as (typeof rates)[number]))}
              onChange={(e) => {
                const hz = rates[Number(e.target.value)]
                if (hz == null) return
                touch('poll')
                void apply((d) => d.patchSensor({ reportRate: hz }))
              }}
            />
          </FieldBusy>

          <FieldBusy busy={busy('lod')} className={css.paraBlock}>
            <span className={css.paraLabel}>Lift Off</span>
            <div className={css.radioRow}>
              {LOD_OPTS.map((o) => {
                const on = state.sensor.lodMm === o.mm
                return (
                  <label key={o.mm} className={css.radio}>
                    <input
                      type="radio"
                      name="fenrir-lod"
                      checked={on}
                      onChange={() => {
                        touch('lod')
                        void apply((d) => d.patchSensor({ lodMm: o.mm }))
                      }}
                    />
                    <span>{o.label}</span>
                  </label>
                )
              })}
            </div>
          </FieldBusy>

          <div className={css.toggleStack}>
            <FieldBusy busy={busy('angleSnap')}>
              <Toggle
                label="Angle snapping"
                on={Boolean(state.sensor.angleSnapping)}
                onChange={(next) => {
                  touch('angleSnap')
                  void apply((d) => d.patchSensor({ angleSnapping: next }))
                }}
              />
            </FieldBusy>
            <FieldBusy busy={busy('motionSync')}>
              <Toggle
                label="Motion sync"
                on={Boolean(state.sensor.motionSync)}
                onChange={(next) => {
                  touch('motionSync')
                  void apply((d) => d.patchSensor({ motionSync: next }))
                }}
              />
            </FieldBusy>
          </div>

          <FieldBusy busy={busy('sleep')} className={css.paraBlock}>
            <span className={css.paraLabel}>Sleep</span>
            <div className={css.inline}>
              <input
                className={css.slider}
                type="range"
                min={FENRIR_SLEEP_MIN_SEC}
                max={FENRIR_SLEEP_MAX_SEC}
                step={FENRIR_SLEEP_STEP_SEC}
                value={resolveFenrirSleepSec(state.settings)}
                onChange={(e) => {
                  touch('sleep')
                  void apply((d) =>
                    d.patchSettings({
                      sleepAfterSec: clampFenrirSleepSec(Number(e.target.value)),
                    }),
                  )
                }}
              />
              <span className={css.unit}>
                {formatFenrirSleep(resolveFenrirSleepSec(state.settings))}
              </span>
            </div>
          </FieldBusy>

          <FieldBusy busy={busy('sensorAngle')} className={css.paraBlock}>
            <span className={css.paraLabel}>Sensor Angle</span>
            <div className={css.inline}>
              <input
                className={css.slider}
                type="range"
                min={-30}
                max={30}
                step={1}
                value={state.sensor.sensorAngle ?? 0}
                onChange={(e) => {
                  touch('sensorAngle')
                  void apply((d) =>
                    d.patchSensor({ sensorAngle: Number(e.target.value) }),
                  )
                }}
              />
              <span className={css.unit}>{state.sensor.sensorAngle ?? 0}°</span>
            </div>
          </FieldBusy>

          <div className={css.paraBlock}>
            <span className={css.paraLabel}>Battery</span>
            <span className={css.batteryVal}>
              {state.info.batteryPercent != null
                ? `${state.info.batteryPercent}%`
                : '-'}
              {state.info.charging ? ' · charging' : ''}
            </span>
          </div>
        </section>
      </div>

      {/* DPI Settings strip */}
      <section className={css.dpiPanel}>
        <h2 className={css.panelTitle}>DPI Settings</h2>
        <div className={css.dpiToolbar}>
          <FieldBusy busy={busy('led')}>
            <Toggle
              compact
              label="LED State"
              on={state.sensor.ledEnabled !== false}
              onChange={(next) => {
                touch('led')
                void apply((d) =>
                  d.patchSensor({
                    ledEnabled: next,
                    ledEffect:
                      next && !(state.sensor.ledEffect && state.sensor.ledEffect > 0)
                        ? 1
                        : state.sensor.ledEffect,
                  }),
                )
              }}
            />
          </FieldBusy>
          <FieldBusy busy={busy('led')} className={css.ledEffectGroup}>
            <span className={css.ledEffectLabel}>LED Effect:</span>
            <label className={css.radio}>
              <input
                type="radio"
                name="led-effect"
                disabled={state.sensor.ledEnabled === false}
                checked={(state.sensor.ledEffect ?? 1) === 1}
                onChange={() => {
                  touch('led')
                  void apply((d) =>
                    d.patchSensor({ ledEnabled: true, ledEffect: 1 }),
                  )
                }}
              />
              Static
            </label>
            <label className={css.radio}>
              <input
                type="radio"
                name="led-effect"
                disabled={state.sensor.ledEnabled === false}
                checked={(state.sensor.ledEffect ?? 1) === 2}
                onChange={() => {
                  touch('led')
                  void apply((d) =>
                    d.patchSensor({ ledEnabled: true, ledEffect: 2 }),
                  )
                }}
              />
              Breathing
            </label>
            <label
              className={[
                css.dpiColorPick,
                state.sensor.ledEnabled === false ? css.dpiColorPickDisabled : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title="Active DPI LED color"
            >
              <span
                className={css.dpiColorSwatch}
                style={{
                  background:
                    stage?.color || fenrirDpiColor(state.sensor.activeDpiIndex),
                }}
              />
              <input
                type="color"
                disabled={state.sensor.ledEnabled === false}
                value={
                  (stage?.color || fenrirDpiColor(state.sensor.activeDpiIndex))
                    .slice(0, 7)
                    .padEnd(7, '0')
                }
                onChange={(e) => {
                  touch('led')
                  void apply((d) => d.setActiveDpiColor?.(e.target.value))
                }}
              />
            </label>
          </FieldBusy>
          <label className={css.levelField}>
            <span>Level</span>
            <select
              className={css.select}
              value={String(state.sensor.activeDpiIndex)}
              onChange={(e) => {
                touch('dpi')
                void apply((d) =>
                  d.patchSensor({ activeDpiIndex: Number(e.target.value) }),
                )
              }}
            >
              {state.sensor.dpiStages
                .filter((s) => s.enabled)
                .map((s) => (
                  <option key={s.index} value={String(s.index)}>
                    {s.index + 1}
                  </option>
                ))}
            </select>
          </label>
          <FieldBusy busy={busy('axisSync')}>
            <Toggle
              compact
              label="Axis Sync"
              on={sync}
              onChange={(next) => {
                touch('axisSync')
                void apply((d) => d.patchSensor({ dpiAxisSync: next }))
              }}
            />
          </FieldBusy>
          <label className={css.levelField}>
            <span>Stages</span>
            <select
              className={css.select}
              value={String(state.sensor.dpiStageCount ?? FENRIR_DPI_MAX_STAGES)}
              onChange={(e) => {
                touch('dpi')
                void apply((d) => d.setDpiStageCount(Number(e.target.value)))
              }}
            >
              {Array.from({ length: FENRIR_DPI_MAX_STAGES }, (_, i) => i + 1).map(
                (n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ),
              )}
            </select>
          </label>
          <div className={css.swatches}>
            {state.sensor.dpiStages.map((s) => {
              const active = s.index === state.sensor.activeDpiIndex
              return (
                <button
                  key={s.index}
                  type="button"
                  disabled={!s.enabled}
                  title={`Level ${s.index + 1}: X${s.value} Y${s.valueY ?? s.value}`}
                  className={[
                    css.swatch,
                    active ? css.swatchActive : '',
                    !s.enabled ? css.swatchDisabled : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ background: s.color || fenrirDpiColor(s.index) }}
                  onClick={() => {
                    if (!s.enabled) return
                    touch('dpi')
                    void apply((d) =>
                      d.patchSensor({ activeDpiIndex: s.index }),
                    )
                  }}
                />
              )
            })}
          </div>
        </div>

        <FieldBusy busy={busy('dpi')} className={css.axisRow}>
          <span className={css.axisLabel}>DPI Current X</span>
          <input
            className={css.slider}
            type="range"
            min={FENRIR_DPI_MIN}
            max={FENRIR_DPI_MAX}
            step={FENRIR_DPI_STEP}
            value={dpiX}
            onChange={(e) => setDpiX(Number(e.target.value))}
          />
          <input
            className={css.num}
            type="number"
            min={FENRIR_DPI_MIN}
            max={FENRIR_DPI_MAX}
            step={FENRIR_DPI_STEP}
            value={dpiX}
            onChange={(e) => setDpiX(Number(e.target.value))}
          />
        </FieldBusy>

        <FieldBusy busy={busy('dpi')} className={css.axisRow}>
          <span className={css.axisLabel}>DPI Current Y</span>
          <input
            className={css.slider}
            type="range"
            min={FENRIR_DPI_MIN}
            max={FENRIR_DPI_MAX}
            step={FENRIR_DPI_STEP}
            value={dpiY}
            disabled={sync}
            onChange={(e) => setDpiY(Number(e.target.value))}
          />
          <input
            className={css.num}
            type="number"
            min={FENRIR_DPI_MIN}
            max={FENRIR_DPI_MAX}
            step={FENRIR_DPI_STEP}
            value={dpiY}
            disabled={sync}
            onChange={(e) => setDpiY(Number(e.target.value))}
          />
        </FieldBusy>
      </section>

      <p className={css.oemCredit}>
        Oryginalne sterowniki:{' '}
        <a
          href="https://www.mouse.xyz/#/"
          target="_blank"
          rel="noopener noreferrer"
        >
          mouse.xyz
        </a>
      </p>
    </div>
  )
}
