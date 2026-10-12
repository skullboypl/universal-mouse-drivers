'use client'

import { useState } from 'react'
import { ClientRedirect } from '../../components/ClientRedirect'
import type { ViperV4ProDriver } from '../../devices/mice/razer/viper-v4-pro/driver'
import { VIPER_V4_PRO_IDENTITY } from '../../devices/mice/razer/viper-v4-pro/identity'
import {
  VIPER_V4_DONGLE_LED_MODES,
  VIPER_V4_DPI_MAX,
  VIPER_V4_DPI_MIN,
  VIPER_V4_DPI_STEP,
  VIPER_V4_MAX_DPI_STAGES,
  VIPER_V4_POLL_RATES_HZ,
  VIPER_V4_SLEEP_SECONDS,
  VIPER_V4_TRACKING_PRESETS,
  type ViperV4DongleLedMode,
  type ViperV4DynModeId,
} from '../../devices/mice/razer/viper-v4-pro/protocol'
import { viperV4ProDeviceAsset } from '../../devices/mice/razer/viper-v4-pro/theme'
import type { ButtonAction } from '../../devices/types'
import { useLocale } from '../../i18n/LocaleContext'
import { useT } from '../../i18n/useT'
import { useDeviceSession } from '../../session/DeviceSessionContext'
import { DynSensChart } from './DynSensChart'
import css from './ViperV4Workspace.module.css'

export type ViperV4Tab =
  | 'customize'
  | 'performance'
  | 'power'
  | 'calibration'
  | 'advanced'

/** Synapse-style Hypershift glyph (secondary / Fn layer). */
function HypershiftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.5"
        y="5.5"
        width="9"
        height="7"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="5.5"
        y="2.5"
        width="9"
        height="7"
        rx="1.2"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M8.2 4.6h3.2M8.2 6.4h2.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Synapse-shaped remap catalog (MW chunk 6120 ButtonCode / DPI / Off). */
const REMAP_ACTIONS: { value: ButtonAction; label: string; labelPl: string }[] = [
  { value: 'left', label: 'Click', labelPl: 'Klik' },
  { value: 'right', label: 'Menu', labelPl: 'Menu' },
  { value: 'middle', label: 'Scroll Click', labelPl: 'Klik scrolla' },
  { value: 'scroll_up', label: 'Scroll Up', labelPl: 'Scroll w górę' },
  { value: 'scroll_down', label: 'Scroll Down', labelPl: 'Scroll w dół' },
  { value: 'forward', label: 'Next', labelPl: 'Dalej' },
  { value: 'back', label: 'Previous', labelPl: 'Wstecz' },
  { value: 'dpi_cycle', label: 'DPI Cycle Up', labelPl: 'DPI w górę' },
  { value: 'dpi_up', label: 'DPI Up', labelPl: 'DPI +' },
  { value: 'dpi_down', label: 'DPI Down', labelPl: 'DPI −' },
  { value: 'disabled', label: 'Disable', labelPl: 'Wyłącz' },
]

export function ViperV4Workspace({ tab = 'customize' }: { tab?: ViperV4Tab }) {
  const { locale, lp } = useLocale()
  const tr = useT()
  const pl = locale === 'pl'
  const { driver, state, apply, connected, syncFromDriver } = useDeviceSession()
  const [hypershift, setHypershiftUi] = useState(false)

  const viper =
    driver?.identity.id === VIPER_V4_PRO_IDENTITY.id
      ? (driver as ViperV4ProDriver)
      : null

  if (!connected || !viper || !state) {
    return <ClientRedirect href={lp('/')} />
  }

  const art = viperV4ProDeviceAsset()
  const sensor = state.sensor
  const info = state.info
  const sleepSec = Math.round((state.settings.sleepAfterMin || 5) * 60)
  const nearestSleep =
    VIPER_V4_SLEEP_SECONDS.find((s) => s >= sleepSec) ??
    VIPER_V4_SLEEP_SECONDS[VIPER_V4_SLEEP_SECONDS.length - 1]
  const extras = viper.viperExtras
  const tracking = extras.smartTracking
  const rotation = extras.rotation
  const dynMode = viper.getDynSensModeId()
  const wireless = info.connection === 'wireless'
  const showMouse = tab === 'customize' || tab === 'performance' || tab === 'calibration'
  const hypershiftTooltip = tr('viper.hypershift.tooltip')

  const setHypershift = (on: boolean) => {
    setHypershiftUi(on)
    viper.setHypershift(on)
  }

  return (
    <div className={css.page}>
      <div className={css.topBar}>
        <div className={css.statusStrip}>
          <span>{wireless ? 'HyperSpeed' : pl ? 'Przewodowo' : 'Wired'}</span>
          <span className={css.statusBatt}>
            {info.batteryPercent == null
              ? '—%'
              : `${info.batteryPercent}%${info.charging ? (pl ? ' · ładowanie' : ' · charging') : ''}`}
          </span>
        </div>
        <h1 className={css.deviceTitle}>Razer Viper V4 Pro</h1>
      </div>

      <div className={showMouse ? css.layout : undefined}>
        {showMouse ? (
          <aside className={css.mousePane}>
            <img
              className={css.art}
              src={art.imageUrl}
              width={art.artWidth}
              height={art.artHeight}
              alt="Razer Viper V4 Pro"
              draggable={false}
            />
            <p className={css.mouseCaption}>Viper V4 Pro</p>
            {tab === 'customize' ? (
              <div className={css.modeBlock}>
                <div
                  className={css.modeToggle}
                  role="group"
                  aria-label={tr('viper.hypershift.name')}
                >
                  <button
                    type="button"
                    className={!hypershift ? css.modeBtnActive : css.modeBtn}
                    onClick={() => setHypershift(false)}
                  >
                    {tr('viper.hypershift.standard')}
                  </button>
                  <button
                    type="button"
                    className={hypershift ? css.modeBtnActive : css.modeBtn}
                    onClick={() => setHypershift(true)}
                    title={hypershiftTooltip}
                    aria-describedby="viper-hypershift-hint"
                  >
                    <HypershiftIcon className={css.modeIcon} />
                    {tr('viper.hypershift.name')}
                  </button>
                </div>
                <p id="viper-hypershift-hint" className={css.modeHint} title={hypershiftTooltip}>
                  <span className={css.modeInfo} aria-hidden="true">
                    i
                  </span>
                  {tr('viper.hypershift.hint')}
                </p>
              </div>
            ) : null}
          </aside>
        ) : null}

        <div className={tab === 'performance' || tab === 'power' ? css.cards2 : css.cards}>
          {tab === 'customize' && (
            <>
              <section className={css.card}>
                <h2 className={css.cardTitle}>{pl ? 'Przyciski' : 'Buttons'}</h2>
                <p className={css.cardDesc}>
                  {hypershift
                    ? tr('viper.buttons.descHypershift')
                    : tr('viper.buttons.descStandard')}
                </p>
                <ul className={css.btnList}>
                  {state.buttons.map((btn) => (
                    <li key={btn.id}>
                      <span>{btn.label}</span>
                      <select
                        value={btn.action}
                        aria-label={btn.label}
                        onChange={(e) => {
                          const action = e.target.value as ButtonAction
                          void apply((d) => {
                            ;(d as ViperV4ProDriver).setHypershift(hypershift)
                            d.setButtonAction(btn.id, action)
                          })
                          syncFromDriver()
                        }}
                      >
                        {REMAP_ACTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {pl ? opt.labelPl : opt.label}
                          </option>
                        ))}
                        {!REMAP_ACTIONS.some((o) => o.value === btn.action) ? (
                          <option value={btn.action}>{btn.action}</option>
                        ) : null}
                      </select>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={css.card}>
                <h2 className={css.cardTitle}>
                  {pl ? 'Wskaźnik LED dongle' : 'LED Indicator'}
                </h2>
                <p className={css.cardDesc}>
                  {pl
                    ? 'Trzy diody HyperSpeed (07/15) — Battery / Connection / Polling…'
                    : 'Three HyperSpeed LEDs (07/15) — Battery / Connection / Polling…'}
                </p>
                {wireless ? (
                  ([0, 1, 2] as const).map((idx) => (
                    <label key={idx} className={css.ledRow}>
                      <span>LED {idx + 1}</span>
                      <select
                        value={extras.dongleLeds[idx]}
                        onChange={(e) => {
                          const mode = Number(e.target.value) as ViperV4DongleLedMode
                          void apply((d) => {
                            ;(d as ViperV4ProDriver).setDongleLed(idx, mode)
                          })
                          syncFromDriver()
                        }}
                      >
                        {VIPER_V4_DONGLE_LED_MODES.map((m) => (
                          <option key={m.id} value={m.id}>
                            {pl ? m.labelPl : m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))
                ) : (
                  <p className={css.note}>
                    {pl
                      ? 'Dostępne tylko na donglu HyperSpeed.'
                      : 'Available only on the HyperSpeed dongle.'}
                  </p>
                )}
              </section>
            </>
          )}

          {tab === 'performance' && (
            <>
              <section className={css.card}>
                <h2 className={css.cardTitle}>{pl ? 'Czułość' : 'Sensitivity'}</h2>
                <p className={css.cardDesc}>
                  {pl
                    ? 'DPI 100–50 000 · X/Y · do 5 stopni (jak Synapse).'
                    : 'DPI 100–50,000 · X/Y · up to 5 stages (Synapse).'}
                </p>
                <div className={css.sliderLabel}>
                  <span>{pl ? 'Liczba stopni' : 'Sensitivity stages'}</span>
                  <span className={css.sliderValue}>
                    {sensor.dpiStageCount ?? VIPER_V4_MAX_DPI_STAGES}
                  </span>
                </div>
                <select
                  value={String(sensor.dpiStageCount ?? VIPER_V4_MAX_DPI_STAGES)}
                  onChange={(e) => {
                    void apply((d) => d.setDpiStageCount(Number(e.target.value)))
                  }}
                >
                  {Array.from({ length: VIPER_V4_MAX_DPI_STAGES }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ),
                  )}
                </select>
                <div style={{ marginTop: 12 }}>
                  <div className={css.xyLabels}>
                    <span />
                    <span />
                    <span>X</span>
                    <span>Y</span>
                  </div>
                  {sensor.dpiStages.map((stage) =>
                    stage.enabled ? (
                      <div key={stage.index} className={css.stageRow}>
                        <strong>{stage.index + 1}</strong>
                        <button
                          type="button"
                          className={
                            sensor.activeDpiIndex === stage.index
                              ? css.chipActive
                              : css.chip
                          }
                          onClick={() => {
                            void apply((d) =>
                              d.patchSensor({ activeDpiIndex: stage.index }),
                            )
                          }}
                        >
                          {stage.value}
                        </button>
                        <input
                          type="number"
                          min={VIPER_V4_DPI_MIN}
                          max={VIPER_V4_DPI_MAX}
                          step={VIPER_V4_DPI_STEP}
                          value={stage.value}
                          aria-label={`DPI X ${stage.index + 1}`}
                          onChange={(e) => {
                            void apply((d) =>
                              d.setDpiStage(stage.index, Number(e.target.value)),
                            )
                          }}
                        />
                        <input
                          type="number"
                          min={VIPER_V4_DPI_MIN}
                          max={VIPER_V4_DPI_MAX}
                          step={VIPER_V4_DPI_STEP}
                          value={stage.valueY ?? stage.value}
                          aria-label={`DPI Y ${stage.index + 1}`}
                          onChange={(e) => {
                            void apply((d) =>
                              d.setDpiStage(
                                stage.index,
                                stage.value,
                                Number(e.target.value),
                              ),
                            )
                          }}
                        />
                      </div>
                    ) : null,
                  )}
                </div>
              </section>

              <section className={css.card}>
                <h2 className={css.cardTitle}>{pl ? 'Polling rate' : 'Polling Rate'}</h2>
                <p className={css.cardDesc}>
                  {pl
                    ? 'Częstotliwość raportów USB / RF (Hz).'
                    : 'USB / RF report frequency (Hz).'}
                </p>
                <div className={css.chipRow}>
                  {VIPER_V4_POLL_RATES_HZ.map((hz) => (
                    <button
                      key={hz}
                      type="button"
                      className={
                        sensor.reportRate === hz ? css.chipActive : css.chip
                      }
                      onClick={() => {
                        void apply((d) => d.patchSensor({ reportRate: hz }))
                      }}
                    >
                      {hz}
                    </button>
                  ))}
                </div>
                <p className={css.note}>
                  Smart Polling Rate Switcher —{' '}
                  {pl ? 'wire: needsCapture' : 'wire: needsCapture'}
                </p>
              </section>
            </>
          )}

          {tab === 'power' && (
            <>
              <section className={css.card}>
                <h2 className={css.cardTitle}>
                  {pl ? 'Oszczędzanie energii' : 'Wireless Power Saving'}
                </h2>
                <p className={css.cardDesc}>
                  {pl
                    ? 'Wejdź w sleep po bezczynności (minuty).'
                    : 'Enter sleep mode if idle for (minutes).'}
                </p>
                <div className={css.sliderLabel}>
                  <span>{pl ? 'Timeout' : 'Idle timeout'}</span>
                  <span className={css.sliderValue}>{nearestSleep / 60} min</span>
                </div>
                <div className={css.chipRow}>
                  {VIPER_V4_SLEEP_SECONDS.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={nearestSleep === sec ? css.chipActive : css.chip}
                      onClick={() => {
                        void apply((d) =>
                          d.patchSettings({ sleepAfterMin: Math.round(sec / 60) }),
                        )
                      }}
                    >
                      {sec / 60}
                    </button>
                  ))}
                </div>
              </section>

              <section className={css.card}>
                <h2 className={css.cardTitle}>Low Power Mode</h2>
                <p className={css.cardDesc}>
                  {pl
                    ? 'Próg baterii dla trybu oszczędzania (wireless).'
                    : 'Battery threshold for low-power wireless mode.'}
                </p>
                <div className={css.sliderLabel}>
                  <span>{pl ? 'Poniżej' : 'Below'}</span>
                  <span className={css.sliderValue}>{extras.lowPowerPercent}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={extras.lowPowerPercent}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    void apply((d) => {
                      ;(d as ViperV4ProDriver).setLowPowerPercent(v)
                    })
                    syncFromDriver()
                  }}
                />
              </section>
            </>
          )}

          {tab === 'calibration' && (
            <section className={`${css.card} ${css.fullWidth}`}>
              <h2 className={css.cardTitle}>Smart Tracking</h2>
              <p className={css.cardDesc}>
                {pl
                  ? 'LOD przez Proximity Sensor 0x0b (orca5Plus) — zapis na mysz.'
                  : 'LOD via Proximity Sensor 0x0b (orca5Plus) — writes to mouse.'}
              </p>
              <div className={css.sliderLabel}>
                <span>Tracking distance</span>
                <span className={css.sliderValue}>
                  {VIPER_V4_TRACKING_PRESETS.find(
                    (p) => p.id === tracking.trackingDistance,
                  )?.[pl ? 'labelPl' : 'label'] ?? tracking.trackingDistance}
                </span>
              </div>
              <div className={css.chipRow}>
                {VIPER_V4_TRACKING_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={
                      tracking.trackingDistance === p.id ? css.chipActive : css.chip
                    }
                    onClick={() => {
                      void apply((d) => {
                        ;(d as ViperV4ProDriver).setSmartTracking({
                          trackingDistance: p.id as 1 | 2 | 3,
                        })
                      })
                      syncFromDriver()
                    }}
                  >
                    {pl ? p.labelPl : p.label}
                  </button>
                ))}
              </div>

              <div className={css.toggleRow}>
                <span>{pl ? 'Asymetryczny cut-off' : 'Enable Asymmetric Cut-off'}</span>
                <button
                  type="button"
                  className={
                    tracking.isAsymmetric
                      ? `${css.toggle} ${css.toggleOn}`
                      : css.toggle
                  }
                  aria-pressed={tracking.isAsymmetric}
                  onClick={() => {
                    void apply((d) => {
                      ;(d as ViperV4ProDriver).setSmartTracking({
                        isAsymmetric: !tracking.isAsymmetric,
                      })
                    })
                    syncFromDriver()
                  }}
                />
              </div>

              {tracking.isAsymmetric ? (
                <>
                  <div className={css.calBlock}>
                    <div className={css.sliderLabel}>
                      <span>Lift-off distance</span>
                      <span className={css.sliderValue}>
                        {tracking.liftOffDistance}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={26}
                      step={1}
                      value={tracking.liftOffDistance}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        const landing =
                          tracking.landingDistance >= v
                            ? Math.max(1, v - 1)
                            : tracking.landingDistance
                        void apply((d) => {
                          ;(d as ViperV4ProDriver).setSmartTracking({
                            liftOffDistance: v,
                            landingDistance: landing,
                          })
                        })
                        syncFromDriver()
                      }}
                    />
                  </div>
                  <div className={css.calBlock}>
                    <div className={css.sliderLabel}>
                      <span>Landing distance</span>
                      <span className={css.sliderValue}>
                        {tracking.landingDistance}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={25}
                      step={1}
                      value={tracking.landingDistance}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        const liftOff =
                          tracking.liftOffDistance <= v
                            ? Math.min(26, v + 1)
                            : tracking.liftOffDistance
                        void apply((d) => {
                          ;(d as ViperV4ProDriver).setSmartTracking({
                            landingDistance: v,
                            liftOffDistance: liftOff,
                          })
                        })
                        syncFromDriver()
                      }}
                    />
                  </div>
                </>
              ) : null}

              <p className={css.note}>
                {pl
                  ? 'Reset fabryczny LOD: L+R+Scroll 7 s (firmware).'
                  : 'Factory LOD reset: L+R+Scroll 7s (firmware).'}
              </p>
            </section>
          )}

          {tab === 'advanced' && (
            <>
              <section className={`${css.card} ${css.fullWidth}`}>
                <h2 className={css.cardTitle}>
                  Dynamic Sensitivity{' '}
                  <span className={css.betaBadge}>BETA</span>
                </h2>
                <p className={css.cardDesc}>
                  {pl
                    ? 'Im szybciej ruszasz myszą, tym inny mnożnik czułości (krzywe Classic / Natural / Jump). Zapis: 0b/10 · 0b/11. BETA — zaleca się używanie Razer Synapse pod tę opcję, jeśli potrzebujesz pełnej pewności działania.'
                    : 'Faster mouse motion → different sensitivity multiplier (Classic / Natural / Jump). Wire: 0b/10 · 0b/11. BETA — Razer Synapse is recommended for this option if you need full reliability.'}
                </p>
                <div className={css.chipRow}>
                  {(
                    [
                      ['off', pl ? 'Wyłączone' : 'Off'],
                      ['classic', 'Classic'],
                      ['natural', 'Natural'],
                      ['jump', 'Jump'],
                      ['custom', 'Custom'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={dynMode === id ? css.chipActive : css.chip}
                      onClick={() => {
                        void apply((d) => {
                          ;(d as ViperV4ProDriver).setDynSensMode(id as ViperV4DynModeId)
                        })
                        syncFromDriver()
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <DynSensChart mode={dynMode} pl={pl} />
              </section>
              <section className={css.card}>
                <h2 className={css.cardTitle}>{pl ? 'Obrót sensora' : 'Rotation'}</h2>
                <p className={css.cardDesc}>
                  {pl
                    ? 'Angle Tune 0b/14 — jak Synapse Advanced (−44°…+44°).'
                    : 'Angle Tune 0b/14 — Synapse Advanced (−44°…+44°).'}
                </p>
                <div className={css.toggleRow}>
                  <span>{pl ? 'Włączony' : 'Enabled'}</span>
                  <button
                    type="button"
                    className={
                      rotation.isEnabled
                        ? `${css.toggle} ${css.toggleOn}`
                        : css.toggle
                    }
                    aria-pressed={rotation.isEnabled}
                    onClick={() => {
                      void apply((d) => {
                        ;(d as ViperV4ProDriver).setRotation({
                          isEnabled: !rotation.isEnabled,
                        })
                      })
                      syncFromDriver()
                    }}
                  />
                </div>
                <div className={css.sliderLabel}>
                  <span>−44° … +44°</span>
                  <span className={css.sliderValue}>{rotation.value}°</span>
                </div>
                <input
                  type="range"
                  min={-44}
                  max={44}
                  step={1}
                  value={rotation.value}
                  disabled={!rotation.isEnabled}
                  onChange={(e) => {
                    void apply((d) => {
                      ;(d as ViperV4ProDriver).setRotation({
                        value: Number(e.target.value),
                        isEnabled: true,
                      })
                    })
                    syncFromDriver()
                  }}
                />
              </section>
            </>
          )}
        </div>
      </div>

      {(viper.lastVerifyNote || viper.protocolDiagnostics.length > 0) && (
        <pre className={css.diag}>
          {[viper.lastVerifyNote, ...viper.protocolDiagnostics]
            .filter(Boolean)
            .join('\n')}
        </pre>
      )}
    </div>
  )
}
