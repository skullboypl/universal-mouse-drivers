'use client'

import { useEffect, useState } from 'react'
import { ClientRedirect } from '../../components/ClientRedirect'
import type { DeviceDriver } from '../../devices/DeviceDriver'
import type { ButtonAction } from '../../devices/types'
import type {
  ProX3SuperstrikeDriver,
  X3WriteResult,
} from '../../devices/mice/logitech/pro-x3-superstrike/driver'
import {
  hitsUiMax,
  X3_BHOP_LIMITS,
  X3_DPI_LIMITS,
  X3_POLL_RATES_HZ,
  X3_VARIANTS,
  type X3Variant,
} from '../../devices/mice/logitech/pro-x3-superstrike/protocol'
import { x3DeviceAsset } from '../../devices/mice/logitech/pro-x3-superstrike/theme'
import { useLocale } from '../../i18n/LocaleContext'
import { useDeviceSession } from '../../session/DeviceSessionContext'
import css from './ProX3Workspace.module.css'

/** OMM's assignment list (HIDActionsDefaults), in the same order and wording. */
const ACTIONS: { value: ButtonAction; pl: string; en: string }[] = [
  { value: 'left', pl: 'Podstawowe kliknięcie (mysz 1)', en: 'Primary click (mouse 1)' },
  { value: 'right', pl: 'Drugie kliknięcie (mysz 2)', en: 'Secondary click (mouse 2)' },
  { value: 'middle', pl: 'Kliknięcie środkowym przyciskiem (mysz 3)', en: 'Middle click (mouse 3)' },
  { value: 'back', pl: 'Kliknięcie przycisku Wstecz (mysz 4)', en: 'Back click (mouse 4)' },
  { value: 'forward', pl: 'Kliknięcie przycisku Dalej (mysz 5)', en: 'Forward click (mouse 5)' },
  { value: 'media_play_pause', pl: 'Odtwarzanie/wstrzymywanie odtwarzania', en: 'Play / pause' },
  { value: 'media_prev', pl: 'Poprzedni utwór', en: 'Previous track' },
  { value: 'media_next', pl: 'Następny utwór', en: 'Next track' },
  { value: 'media_mute', pl: 'Wycisz', en: 'Mute' },
  { value: 'media_vol_up', pl: 'Zwiększenie głośności', en: 'Volume up' },
  { value: 'media_vol_down', pl: 'Zmniejszenie głośności', en: 'Volume down' },
  { value: 'dpi_shift', pl: 'Zmiana DPI', en: 'DPI shift' },
  { value: 'g_shift', pl: 'G-Shift', en: 'G-Shift' },
  { value: 'profile_cycle', pl: 'Przełączanie profili', en: 'Cycle profiles' },
  { value: 'dpi_cycle', pl: 'Przełączanie DPI', en: 'Cycle DPI' },
  { value: 'scroll_left', pl: 'Odchyl w lewo', en: 'Tilt left' },
  { value: 'scroll_right', pl: 'Odchyl w prawo', en: 'Tilt right' },
  { value: 'disabled', pl: 'Brak działania', en: 'No action' },
]

const LOD_LEVELS: { value: 1 | 2 | 3; pl: string; en: string }[] = [
  { value: 1, pl: 'Niski', en: 'Low' },
  { value: 2, pl: 'Średni', en: 'Medium' },
  { value: 3, pl: 'Wysoki', en: 'High' },
]

const VARIANT_ORDER: Exclude<X3Variant, 'unknown'>[] = ['midnight-black', 'magenta-eclipse']

/**
 * Button pad bounding boxes on the 1200 x 1028 product photo (top view),
 * measured directly on `mouse-midnight-black.png`: the click surface runs
 * from the top shell seam (~y=195, just above the scroll wheel) down to the
 * seam above the "+" DPI icons (~y=490), split at the center line (x=600).
 */
const GAUGE_RECT = {
  left: { x: 413, y: 196, w: 182, h: 292 },
  right: { x: 605, y: 196, w: 182, h: 292 },
} as const

function hex(value: number | null | undefined): string {
  return value == null ? '-' : `0x${value.toString(16).toUpperCase().padStart(2, '0')}`
}

function toHexDump(bytes: Uint8Array): string {
  const rows: string[] = []
  for (let i = 0; i < bytes.length; i += 16) {
    const row = Array.from(bytes.subarray(i, i + 16))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
    rows.push(`${i.toString(16).padStart(4, '0')}  ${row}`)
  }
  return rows.join('\n')
}

type GaugeProps = {
  side: 'left' | 'right'
  /** Actuation point as a fraction of full travel (0..1). */
  actuation: number | null
  /** Live travel as a fraction of full travel (0..1), null = no signal. */
  travel: number | null
  label: string
}

/** Travel gauge drawn on a button face: filled = live press depth, line = actuation point. */
function ButtonGauge({ side, actuation, travel, label }: GaugeProps) {
  const r = GAUGE_RECT[side]
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
  const fillH = travel == null ? 0 : r.h * clamp01(travel)
  const lineY = actuation == null ? null : r.y + r.h * clamp01(actuation)
  const pressed = travel != null && actuation != null && travel >= actuation
  return (
    <g>
      <rect className={css.gaugeTrack} x={r.x} y={r.y} width={r.w} height={r.h} rx={34} />
      <rect
        className={pressed ? css.gaugeFillActive : css.gaugeFill}
        x={r.x}
        y={r.y}
        width={r.w}
        height={fillH}
        rx={34}
      />
      {lineY != null ? (
        <g>
          <line className={css.gaugeLine} x1={r.x - 8} x2={r.x + r.w + 8} y1={lineY} y2={lineY} />
          <text
            className={css.gaugeText}
            x={side === 'left' ? r.x - 14 : r.x + r.w + 14}
            y={lineY + 12}
            textAnchor={side === 'left' ? 'end' : 'start'}
          >
            {label}
          </text>
        </g>
      ) : null}
    </g>
  )
}

export function ProX3Workspace() {
  const { connected, state, driver, apply, disconnect, refreshFromDevice } = useDeviceSession()
  const { locale } = useLocale()
  const pl = locale === 'pl'

  const [live, setLive] = useState<{ left: number | null; right: number | null }>({ left: null, right: null })
  const [sectorDump, setSectorDump] = useState<{ sector: number; bytes: Uint8Array } | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [dpiDraft, setDpiDraft] = useState<Record<number, string>>({})
  const [bhopDraft, setBhopDraft] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const maybeX3 = driver as ProX3SuperstrikeDriver | null

  useEffect(() => {
    if (!maybeX3?.onHitsLiveUpdate) return
    return maybeX3.onHitsLiveUpdate((left, right) => setLive({ left, right }))
  }, [maybeX3])

  if (!connected || !state || !driver || !maybeX3) {
    return <ClientRedirect href="/" />
  }
  const x3: ProX3SuperstrikeDriver = maybeX3
  const drv = (d: DeviceDriver) => d as ProX3SuperstrikeDriver
  const sensor = state.sensor

  const hits = driver.hitsCapabilities
  const mask = hits?.analogButtonsBitfield ?? 0x03
  const leftPresent = (mask & 0x01) !== 0
  const rightPresent = (mask & 0x02) !== 0
  // Live travel and the actuation point share one scale: 0..10 (full press reads 10 on a real X3).
  const actuationMax = hitsUiMax(hits?.actuationMax ?? 40)
  const hapticsMax = hitsUiMax(hits?.hapticsMax ?? 20)
  const rtMax = hitsUiMax(hits?.rapidTriggerMax ?? 20)

  const battery = state.info.batteryPercent == null ? '-' : `${state.info.batteryPercent}%`
  const resolvedVariant: X3Variant =
    state.info.colorVariant && state.info.colorVariant !== 'unknown'
      ? state.info.colorVariant
      : (x3.caseVariantOverride ?? 'unknown')
  const deviceAsset = x3DeviceAsset(resolvedVariant)
  const variantIsGuess = state.info.colorVariant === 'unknown' || !state.info.colorVariant

  const isDemo = x3.hitsReadStatus === 'demo'
  const hitsKnown = isDemo || x3.hitsReadStatus === 'verified'
  const hitsWritable = x3.hitsWritesEnabled && x3.hitsReadStatus === 'verified'
  const profileEditable = x3.profileLoaded && x3.profileWritesEnabled
  const unresolved = pl ? 'nieustalone' : 'unresolved'
  const currentDpi = sensor.dpiStages[sensor.activeDpiIndex]?.value

  const sensorLock = isDemo
    ? (pl ? 'Tryb demo - zapis na urządzenie niedostępny.' : 'Demo mode - writing to the device is unavailable.')
    : x3.onboardMode === 'host'
      ? (pl ? 'Mysz jest w trybie host - przełącz ją na tryb wbudowany, aby edytować profil.' : 'The mouse is in host mode - switch it to onboard mode to edit the profile.')
      : (pl ? 'Profil onboard nie został wczytany.' : 'The onboard profile has not been loaded.')

  async function run(key: string, job: () => Promise<X3WriteResult>) {
    setNotes((n) => ({ ...n, [key]: pl ? 'Zapisywanie…' : 'Writing…' }))
    const result = await job()
    setNotes((n) => ({ ...n, [key]: pl ? result.messagePl : result.message }))
    await apply(() => undefined, { autosave: false })
  }

  const editAndSave = async (
    key: string,
    edit: (d: ProX3SuperstrikeDriver) => void,
    save: () => Promise<X3WriteResult>,
  ) => {
    await apply((d) => edit(drv(d)), { autosave: false })
    await run(key, save)
  }

  const commitDpiInput = async (index: number) => {
    const raw = dpiDraft[index]
    if (raw == null) return
    setDpiDraft((d) => {
      const copy = { ...d }
      delete copy[index]
      return copy
    })
    const value = Number(raw)
    if (!Number.isFinite(value) || value <= 0) return
    await editAndSave('dpi', (d) => d.setDpiStage(index, value), () => x3.commitDpi())
  }

  const commitBhopInput = async () => {
    if (bhopDraft == null) return
    const value = Number(bhopDraft)
    setBhopDraft(null)
    if (!Number.isFinite(value)) return
    await editAndSave('bhop', (d) => d.setBhop(true, value), () => x3.commitBhop())
  }

  const hitsField = (button: 'left' | 'right') =>
    button === 'left'
      ? { actuation: sensor.hitsLeftActuation, rtEnabled: sensor.hitsLeftRapidTriggerEnabled, rtSensitivity: sensor.hitsLeftRapidTriggerSensitivity, haptic: sensor.hitsLeftHaptic }
      : { actuation: sensor.hitsRightActuation, rtEnabled: sensor.hitsRightRapidTriggerEnabled, rtSensitivity: sensor.hitsRightRapidTriggerSensitivity, haptic: sensor.hitsRightHaptic }

  const commitHits = (button: 'left' | 'right') => run(`hits-${button}`, () => x3.writeHitsToDevice(button))

  function renderHitsColumn(button: 'left' | 'right') {
    const f = hitsField(button)
    const title = button === 'left' ? (pl ? 'Lewy przycisk' : 'Left button') : pl ? 'Prawy przycisk' : 'Right button'
    return (
      <div key={button} className={css.hitsColumn}>
        <h3 className={css.hitsButtonTitle}>{title}</h3>
        <label className={css.field}>
          <span>{pl ? 'Punkt aktywacji' : 'Actuation point'}</span>
          <div className={css.fieldRow}>
            <input
              type="range"
              min={1}
              max={actuationMax}
              disabled={!hitsKnown || !hitsWritable}
              value={f.actuation ?? 1}
              onChange={(e) => void apply((d) => drv(d).setHitsActuation(button, Number(e.target.value)), { autosave: false })}
              onPointerUp={() => void commitHits(button)}
              onKeyUp={() => void commitHits(button)}
            />
            <output>{f.actuation ?? unresolved}</output>
          </div>
        </label>
        <label className={css.checkboxRow}>
          <input
            type="checkbox"
            checked={f.rtEnabled ?? false}
            disabled={!hitsKnown || !hitsWritable}
            onChange={async (e) => {
              await apply((d) => drv(d).setHitsRapidTrigger(button, e.target.checked), { autosave: false })
              await commitHits(button)
            }}
          />
          <span>Rapid Trigger</span>
        </label>
        <label className={css.field}>
          <span>{pl ? 'Czułość RT' : 'RT sensitivity'}</span>
          <div className={css.fieldRow}>
            <input
              type="range"
              min={1}
              max={rtMax}
              disabled={!hitsKnown || !hitsWritable || !f.rtEnabled}
              value={f.rtSensitivity ?? 1}
              onChange={(e) => void apply((d) => drv(d).setHitsRapidTrigger(button, true, Number(e.target.value)), { autosave: false })}
              onPointerUp={() => void commitHits(button)}
              onKeyUp={() => void commitHits(button)}
            />
            <output>{f.rtSensitivity ?? unresolved}</output>
          </div>
        </label>
        <label className={css.field}>
          <span>{pl ? 'Haptyka' : 'Haptics'}</span>
          <div className={css.fieldRow}>
            <input
              type="range"
              min={0}
              max={hapticsMax}
              disabled={!hitsKnown || !hitsWritable}
              value={f.haptic ?? 0}
              onChange={(e) => void apply((d) => drv(d).setHitsHaptic(button, Number(e.target.value)), { autosave: false })}
              onPointerUp={() => void commitHits(button)}
              onKeyUp={() => void commitHits(button)}
            />
            <output>{f.haptic ?? unresolved}</output>
          </div>
        </label>
        {notes[`hits-${button}`] ? <p className={css.writeNote}>{notes[`hits-${button}`]}</p> : null}
      </div>
    )
  }

  const stageCount = sensor.dpiStageCount || 1
  const enabledStages = sensor.dpiStages.filter((stage) => stage.enabled)

  return (
    <div className={css.page}>
      <div className={css.statusRow}>
        <span className={css.deviceFullName}>
          {driver.identity.brand} {driver.identity.model}
        </span>
        <span className={css.statusBatt}>
          {battery}
          {state.info.charging ? (pl ? ' · ładowanie' : ' · charging') : ''}
        </span>
        <span>{state.info.connection === 'wireless' ? 'LIGHTSPEED' : pl ? 'PRZEWODOWO' : 'WIRED'}</span>
        <span className={css.modeChip} data-mode={x3.onboardMode}>
          {x3.onboardMode === 'onboard'
            ? (pl ? 'Tryb wbudowany' : 'Onboard mode')
            : x3.onboardMode === 'host'
              ? (pl ? 'Tryb host (G HUB)' : 'Host mode (G HUB)')
              : (pl ? 'Tryb nieustalony' : 'Mode unknown')}
        </span>
        <span className={css.statusSpacer} />
        {driver.lastVerifyNote ? (
          <span title={driver.lastVerifyNote}>
            {driver.mouseReachable ? (pl ? 'Połączono' : 'Connected') : pl ? 'Brak odpowiedzi HID++' : 'No HID++ reply'}
          </span>
        ) : null}
      </div>

      {x3.onboardMode === 'host' ? (
        <div className={css.modeNotice} role="status">
          <span>
            {pl
              ? 'Mysz jest w trybie host (sterowanie z oprogramowania, np. G HUB) - ustawienia z jej profilu nie działają. Przy zapisie przełączę ją w tryb wbudowany, G HUB nie jest potrzebny.'
              : 'The mouse is in host mode (controlled by software such as G HUB), so its profile settings do not apply. Saving switches it to onboard mode - G HUB is not needed.'}
          </span>
          <button
            type="button"
            className={css.toolBtn}
            onClick={async () => {
              const r = await x3.switchToOnboardMode()
              setNotes((n) => ({ ...n, mode: pl ? r.messagePl : r.message }))
              await apply(() => undefined, { autosave: false })
            }}
          >
            {pl ? 'Przełącz na tryb wbudowany' : 'Switch to onboard mode'}
          </button>
        </div>
      ) : null}
      {x3.onboardMode === 'onboard' ? (
        <div className={css.modeNotice} role="status">
          <span>
            {pl
              ? 'Mysz jest w trybie wbudowanym. Wróć do trybu host, jeśli chcesz otworzyć G HUB lub inne oprogramowanie producenta.'
              : 'The mouse is in onboard mode. Switch back to host mode if you want to open G HUB or other manufacturer software.'}
          </span>
          <button
            type="button"
            className={css.toolBtn}
            onClick={async () => {
              const r = await x3.switchToHostMode()
              setNotes((n) => ({ ...n, mode: pl ? r.messagePl : r.message }))
              await apply(() => undefined, { autosave: false })
            }}
          >
            {pl ? 'Przełącz na tryb host (G HUB)' : 'Switch to host mode (G HUB)'}
          </button>
        </div>
      ) : null}
      {notes.mode ? <p className={css.lockNote}>{notes.mode}</p> : null}

      <div className={css.mainGrid}>
        <section className={css.panel}>
          <h2 className={css.panelTitle}>Sensor</h2>
          {!profileEditable ? <p className={css.lockNote}>{sensorLock}</p> : null}

          <div className={css.group}>
            <h3 className={css.groupTitle}>DPI</h3>
            <div className={css.inlineRow}>
              <label className={css.inlineLabel}>
                <span>{pl ? 'Liczba poziomów' : 'Stages'}</span>
                <select
                  className={css.select}
                  disabled={!profileEditable}
                  value={String(stageCount)}
                  onChange={(e) => void editAndSave('dpi', (d) => d.setDpiStageCount(Number(e.target.value)), () => x3.commitDpi())}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))}
                </select>
              </label>
              <span className={css.liveDpi}>
                {pl ? 'Aktualnie' : 'Current'}: <b>{currentDpi ?? unresolved}</b>
              </span>
            </div>
            <div className={css.dpiList}>
              {sensor.dpiStages.map((stage) => {
                const draft = dpiDraft[stage.index]
                return (
                  <div key={stage.index} className={`${css.dpiRow} ${stage.enabled ? '' : css.dpiRowOff}`}>
                    <span className={css.dpiIndex}>{stage.index + 1}</span>
                    <input
                      className={css.dpiInput}
                      type="number"
                      min={X3_DPI_LIMITS.min}
                      max={X3_DPI_LIMITS.max}
                      step={X3_DPI_LIMITS.step}
                      disabled={!profileEditable || !stage.enabled}
                      value={draft ?? (stage.enabled ? String(stage.value) : '')}
                      placeholder={stage.enabled ? undefined : '-'}
                      onChange={(e) => setDpiDraft((d) => ({ ...d, [stage.index]: e.target.value }))}
                      onBlur={() => void commitDpiInput(stage.index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      }}
                    />
                    <span className={css.dpiBadges} aria-hidden>
                      {stage.enabled && sensor.defaultDpiIndex === stage.index ? '★' : ''}
                      {stage.enabled && sensor.dpiShiftIndex === stage.index ? '⇧' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className={css.inlineRow}>
              <label className={css.inlineLabel}>
                <span>{pl ? 'Domyślny ★' : 'Default ★'}</span>
                <select
                  className={css.select}
                  disabled={!profileEditable}
                  value={String(sensor.defaultDpiIndex ?? 0)}
                  onChange={(e) => void editAndSave('dpi', (d) => d.setDefaultDpiIndex(Number(e.target.value)), () => x3.commitDpi())}
                >
                  {enabledStages.map((stage) => (
                    <option key={stage.index} value={String(stage.index)}>{stage.index + 1} · {stage.value}</option>
                  ))}
                </select>
              </label>
              <label className={css.inlineLabel}>
                <span>{pl ? 'Zmiana DPI ⇧' : 'DPI shift ⇧'}</span>
                <select
                  className={css.select}
                  disabled={!profileEditable}
                  value={String(sensor.dpiShiftIndex ?? 0)}
                  onChange={(e) => void editAndSave('dpi', (d) => d.setDpiShiftIndex(Number(e.target.value)), () => x3.commitDpi())}
                >
                  {enabledStages.map((stage) => (
                    <option key={stage.index} value={String(stage.index)}>{stage.index + 1} · {stage.value}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className={css.inlineLabel}>
              <span>LOD</span>
              <select
                className={css.select}
                disabled={!profileEditable}
                value={String(sensor.lodLevel ?? 2)}
                onChange={(e) => void editAndSave('dpi', (d) => d.setLodLevel(Number(e.target.value) as 1 | 2 | 3), () => x3.commitDpi())}
              >
                {LOD_LEVELS.map((lod) => (
                  <option key={lod.value} value={String(lod.value)}>{pl ? lod.pl : lod.en}</option>
                ))}
              </select>
            </label>
            {notes.dpi ? <p className={css.writeNote}>{notes.dpi}</p> : null}
          </div>

          <div className={css.group}>
            <h3 className={css.groupTitle}>{pl ? 'Częstotliwość odpytywania' : 'Polling rate'}</h3>
            <div className={css.inlineRow}>
              <label className={css.inlineLabel}>
                <span>{pl ? 'Bezprzewodowo' : 'Wireless'}</span>
                <select
                  className={css.select}
                  disabled={!profileEditable}
                  value={String(sensor.reportRateWireless ?? '')}
                  onChange={(e) => void editAndSave('rates', (d) => d.setPollingRate('wireless', Number(e.target.value)), () => x3.commitRates())}
                >
                  {sensor.reportRateWireless == null ? <option value="">-</option> : null}
                  {X3_POLL_RATES_HZ.map((hz) => (
                    <option key={hz} value={String(hz)}>{hz} Hz</option>
                  ))}
                </select>
              </label>
              <label className={css.inlineLabel}>
                <span>{pl ? 'Kablem' : 'Cable'}</span>
                <select
                  className={css.select}
                  disabled={!profileEditable}
                  value={String(sensor.reportRateWired ?? '')}
                  onChange={(e) => void editAndSave('rates', (d) => d.setPollingRate('wired', Number(e.target.value)), () => x3.commitRates())}
                >
                  {sensor.reportRateWired == null ? <option value="">-</option> : null}
                  {X3_POLL_RATES_HZ.map((hz) => (
                    <option key={hz} value={String(hz)}>{hz} Hz</option>
                  ))}
                </select>
              </label>
            </div>
            {notes.rates ? <p className={css.writeNote}>{notes.rates}</p> : null}
          </div>

          <div className={css.group}>
            <h3 className={css.groupTitle}>{pl ? 'Powierzchnia gamingowa' : 'Gaming surface'}</h3>
            <p className={css.groupHint}>
              {pl
                ? 'Dostraja czujnik pod matę gamingową. Auto pozwala myszy zdecydować; wyłącz, jeśli tracking źle się zachowuje na powierzchni niegamingowej.'
                : 'Tunes the sensor for gaming mouse pads. Auto lets the mouse decide; turn it off if tracking misbehaves on a non-gaming surface.'}
            </p>
            <label className={css.inlineLabel}>
              <span>{pl ? 'Tryb' : 'Mode'}</span>
              <select
                className={css.select}
                disabled={!x3.profileWritesEnabled}
                value={sensor.gamingSurfaceMode ?? ''}
                onChange={(e) =>
                  void run('gamingSurface', () =>
                    x3.commitGamingSurfaceMode(e.target.value as 'Auto' | 'On' | 'Off'),
                  )
                }
              >
                {sensor.gamingSurfaceMode == null ? (
                  <option value="">{pl ? 'nieznane' : 'unknown'}</option>
                ) : null}
                <option value="Auto">Auto</option>
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </label>
            {notes.gamingSurface ? <p className={css.writeNote}>{notes.gamingSurface}</p> : null}
          </div>

          <div className={css.group}>
            <h3 className={css.groupTitle}>LightForce</h3>
            <p className={css.groupHint}>
              {pl
                ? 'Hybrid oszczędza baterię, budząc czujnik optyczny tylko gdy trzeba. Optical only jest bardziej spójny, ale zużywa więcej baterii.'
                : 'Hybrid saves power by waking the optical sensor only when needed. Optical only is more consistent but uses more battery.'}
            </p>
            <label className={css.inlineLabel}>
              <span>{pl ? 'Tryb przełączników' : 'Switch mode'}</span>
              <select
                className={css.select}
                disabled={!x3.profileWritesEnabled}
                value={sensor.lightforceMode ?? ''}
                onChange={(e) =>
                  void run('lightforce', () =>
                    x3.commitLightforceMode(e.target.value as 'Optical' | 'Hybrid'),
                  )
                }
              >
                {sensor.lightforceMode == null ? (
                  <option value="">{pl ? 'nieznane' : 'unknown'}</option>
                ) : null}
                <option value="Hybrid">Hybrid</option>
                <option value="Optical">Optical only</option>
              </select>
            </label>
            {notes.lightforce ? <p className={css.writeNote}>{notes.lightforce}</p> : null}
          </div>

          <div className={css.group}>
            <h3 className={css.groupTitle}>{pl ? 'Tryb BHOP' : 'BHOP mode'}</h3>
            <div className={css.inlineRow}>
              <label className={css.checkboxRow}>
                <input
                  type="checkbox"
                  disabled={!profileEditable}
                  checked={!!sensor.bhopEnabled}
                  onChange={(e) =>
                    void editAndSave(
                      'bhop',
                      (d) => d.setBhop(e.target.checked, e.target.checked ? (sensor.bhopTimeoutMs ?? X3_BHOP_LIMITS.minMs) : undefined),
                      () => x3.commitBhop(),
                    )
                  }
                />
                <span>{pl ? 'Włączony' : 'Enabled'}</span>
              </label>
              <label className={css.msField}>
                <input
                  className={css.dpiInput}
                  type="number"
                  min={X3_BHOP_LIMITS.minMs}
                  max={X3_BHOP_LIMITS.maxMs}
                  step={X3_BHOP_LIMITS.stepMs}
                  disabled={!profileEditable || !sensor.bhopEnabled}
                  value={bhopDraft ?? (sensor.bhopEnabled ? String(sensor.bhopTimeoutMs ?? X3_BHOP_LIMITS.minMs) : '')}
                  placeholder="-"
                  onChange={(e) => setBhopDraft(e.target.value)}
                  onBlur={() => void commitBhopInput()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                />
                <span>ms</span>
              </label>
            </div>
            {notes.bhop ? <p className={css.writeNote}>{notes.bhop}</p> : null}
          </div>
        </section>

        <section className={css.center}>
          <div className={css.mouseStage}>
            <img className={css.deviceImg} src={deviceAsset} alt={driver.identity.model} draggable={false} />
            <svg
              className={css.gaugeLayer}
              viewBox="0 0 1200 1028"
              preserveAspectRatio="none"
              aria-label={pl ? 'Skok przycisków na żywo' : 'Live button travel'}
            >
              {leftPresent ? (
                <ButtonGauge
                  side="left"
                  actuation={sensor.hitsLeftActuation == null ? null : sensor.hitsLeftActuation / actuationMax}
                  travel={live.left == null ? null : live.left / actuationMax}
                  label={String(sensor.hitsLeftActuation ?? '')}
                />
              ) : null}
              {rightPresent ? (
                <ButtonGauge
                  side="right"
                  actuation={sensor.hitsRightActuation == null ? null : sensor.hitsRightActuation / actuationMax}
                  travel={live.right == null ? null : live.right / actuationMax}
                  label={String(sensor.hitsRightActuation ?? '')}
                />
              ) : null}
            </svg>
          </div>
          <p className={css.deviceName}>
            {driver.identity.brand} {driver.identity.model}
          </p>

          <div className={css.hitsPair}>
            {leftPresent ? renderHitsColumn('left') : null}
            {rightPresent ? renderHitsColumn('right') : null}
          </div>
          {!hitsWritable ? (
            <p className={css.lockNote}>
              {isDemo
                ? (pl ? 'Tryb demo - zapis HITS niedostępny.' : 'Demo mode - HITS writing is unavailable.')
                : (pl ? 'Nie odczytano wartości HITS z urządzenia.' : 'HITS values were not read from the device.')}
            </p>
          ) : null}

          <div className={css.variantPicker}>
            <span className={css.variantLabel}>{pl ? 'Wariant obudowy' : 'Case variant'}</span>
            <div className={css.variantSwatches}>
              {VARIANT_ORDER.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`${css.variantSwatch} ${resolvedVariant === v ? css.variantSwatchActive : ''}`}
                  aria-pressed={resolvedVariant === v}
                  onClick={() => void apply((d) => drv(d).setCaseVariantOverride(v))}
                  title={X3_VARIANTS[v].label}
                >
                  <span className={css.variantDot} style={{ background: v === 'midnight-black' ? '#1b1b1d' : '#c22b6e' }} />
                  {X3_VARIANTS[v].label}
                </button>
              ))}
            </div>
            {variantIsGuess ? (
              <p className={css.variantNote}>
                {pl ? 'Urządzenie nie zgłasza koloru - wybór jest zapamiętywany lokalnie.' : 'The device does not report color - this choice is remembered locally.'}
              </p>
            ) : null}
          </div>

          <div className={css.toolRow}>
            <button type="button" className={css.toolBtn} onClick={() => void disconnect()}>
              {pl ? 'Odłącz' : 'Disconnect'}
            </button>
            <button type="button" className={css.toolBtn} onClick={() => void refreshFromDevice()}>
              {pl ? 'Odśwież' : 'Refresh'}
            </button>
          </div>
        </section>

        <section className={css.panel}>
          <h2 className={css.panelTitle}>{pl ? 'Przypisania' : 'Assignments'}</h2>
          {!profileEditable ? <p className={css.lockNote}>{sensorLock}</p> : null}
          <div className={css.assignTable}>
            <div className={css.assignHead}>
              <span>{pl ? 'Przycisk' : 'Button'}</span>
              <span>{pl ? 'Przypisanie' : 'Assignment'}</span>
            </div>
            {state.buttons.map((b) => {
              const locked = b.id === 1 || b.id === 2
              const unsupported = x3.unsupportedButtons.has(b.id)
              return (
                <div key={b.id} className={css.assignRow}>
                  <span className={css.assignNum}>{b.id}</span>
                  <select
                    className={`${css.select} ${css.assignSelect}`}
                    value={b.action}
                    disabled={locked || !profileEditable}
                    onChange={(e) =>
                      void editAndSave(`btn-${b.id}`, (d) => d.setButtonAction(b.id, e.target.value as ButtonAction), () => x3.commitButton(b.id))
                    }
                  >
                    {unsupported ? (
                      <option value="macro" disabled>
                        {pl ? 'Makro / sekwencja klawiszy (bez zmian)' : 'Macro / key sequence (unchanged)'}
                      </option>
                    ) : null}
                    {ACTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {pl ? a.pl : a.en}
                      </option>
                    ))}
                  </select>
                  {notes[`btn-${b.id}`] ? <span className={css.assignNote}>{notes[`btn-${b.id}`]}</span> : null}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <details className={css.advanced} open={advancedOpen} onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}>
        <summary>{pl ? 'Zaawansowane / Diagnostyka' : 'Advanced / Diagnostics'}</summary>

        <div className={css.advancedGrid}>
          <dl className={css.runtime}>
            <div><dt>{pl ? 'Połączenie' : 'Connection'}</dt><dd>{state.info.connection}</dd></div>
            <div><dt>{pl ? 'Indeks HITS' : 'HITS index'}</dt><dd>{hex(hits?.featureIndex)}</dd></div>
            <div><dt>{pl ? 'Kod statusu baterii' : 'Battery status code'}</dt><dd>{hex(state.info.batteryStatusCode)}</dd></div>
            <div><dt>Model ID</dt><dd>{state.info.modelIdHex || '-'}</dd></div>
            <div><dt>{pl ? 'Odczyt HITS' : 'HITS read'}</dt><dd>{x3.hitsReadStatus === 'verified' ? (pl ? 'z urządzenia' : 'from device') : x3.hitsReadStatus === 'demo' ? 'demo' : unresolved}</dd></div>
            <div><dt>{pl ? 'Profil onboard' : 'Onboard profile'}</dt><dd>{x3.onboardProfileNote ?? '-'}</dd></div>
          </dl>

          <div className={css.log}>
            <h3>{pl ? 'Log protokołu' : 'Protocol log'}</h3>
            <ol>
              {(driver.protocolDiagnostics?.length ? driver.protocolDiagnostics : [pl ? 'Oczekiwanie na odczyt HID++' : 'Awaiting physical HID++ read']).map((line, index) => (
                <li key={`${index}-${line}`}>{line}</li>
              ))}
            </ol>
          </div>

          <div className={css.calibration}>
            <h3>{pl ? 'Sektor aktywnego profilu (tylko odczyt)' : 'Active profile sector (read-only)'}</h3>
            <p>
              {pl
                ? 'Układ formatu 8: polling @0/1, DPI ×5 @4, BHOP @0x25, HITS @0x26, przyciski @0x30; CRC obejmuje cały sektor bez ostatnich dwóch bajtów. Każdy zapis sprawdza format, CRC i odczyt zwrotny.'
                : 'Format-8 layout: polling @0/1, DPI x5 @4, BHOP @0x25, HITS @0x26, buttons @0x30; the CRC covers the whole sector except its last two bytes. Every write checks the format, the CRC and reads the sector back.'}
            </p>
            <div className={css.calibrationRow}>
              <button
                type="button"
                className={css.toolBtn}
                onClick={async () => {
                  const dump = await x3.captureSectorDump()
                  setSectorDump(dump ? { sector: dump.sector, bytes: dump.bytes } : null)
                }}
              >
                {pl ? 'Odczytaj sektor' : 'Read sector'}
              </button>
            </div>
            {sectorDump ? (
              <details className={css.hexDump} open>
                <summary>{`Profile 0x${sectorDump.sector.toString(16)} (hex)`}</summary>
                <pre>{toHexDump(sectorDump.bytes)}</pre>
              </details>
            ) : null}
          </div>
        </div>
      </details>
    </div>
  )
}
