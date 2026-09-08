'use client'

import { useEffect, useRef, useState } from 'react'
import { ClientRedirect } from '../../components/ClientRedirect'
import type { ButtonAction } from '../../devices/types'
import {
  SUPERLIGHT_DPI_MAX,
  SUPERLIGHT_DPI_MAX_STAGES,
  SUPERLIGHT_DPI_MIN,
  SUPERLIGHT_DPI_STEP,
  SUPERLIGHT_REPORT_RATES,
} from '../../devices/mice/logitech/pro-x-superlight/defaults'
import { SUPERLIGHT_OEM } from '../../devices/mice/logitech/pro-x-superlight/theme'
import type { SuperlightDriver } from '../../devices/mice/logitech/pro-x-superlight/driver'
import { useLocale } from '../../i18n/LocaleContext'
import type { MessageKey } from '../../i18n/messages'
import { useT } from '../../i18n/useT'
import { useDeviceSession } from '../../session/DeviceSessionContext'
import css from './SuperlightOemWorkspace.module.css'

/** OMM HIDActionsDefaults order: L/R/M/Back/Forward + DPI cycle / off. */
const ACTIONS: { value: ButtonAction; key: MessageKey; lock?: boolean }[] = [
  { value: 'left', key: 'buttons.action.left', lock: true },
  { value: 'right', key: 'buttons.action.right', lock: true },
  { value: 'middle', key: 'buttons.action.middle' },
  { value: 'back', key: 'buttons.action.back' },
  { value: 'forward', key: 'buttons.action.forward' },
  { value: 'dpi_cycle', key: 'buttons.action.dpi_cycle' },
  { value: 'disabled', key: 'buttons.action.disabled' },
]

/**
 * OMM-like layout for PRO X SUPERLIGHT:
 * DPI | mouse photo | Assignments + polling rate under DPI column.
 */
export function SuperlightOemWorkspace() {
  const { connected, state, driver, apply, disconnect, refreshFromDevice } =
    useDeviceSession()
  const { lp, locale } = useLocale()
  const tr = useT()
  const [dpiMenu, setDpiMenu] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (dpiMenu == null) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setDpiMenu(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDpiMenu(null)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [dpiMenu])

  if (!connected || !state || !driver) {
    return <ClientRedirect href={lp('/')} />
  }

  const stageCount = state.sensor.dpiStageCount ?? SUPERLIGHT_DPI_MAX_STAGES
  const stages = state.sensor.dpiStages.slice(0, SUPERLIGHT_DPI_MAX_STAGES)
  const batt = state.info.batteryPercent
  const pl = locale === 'pl'
  const profileCount = Math.max(
    1,
    (driver as SuperlightDriver).profileCount ?? 5,
  )
  const dpiMin = state.sensor.dpiListMin ?? SUPERLIGHT_DPI_MIN
  const dpiMax = state.sensor.dpiListMax ?? SUPERLIGHT_DPI_MAX
  const dpiStep = state.sensor.dpiListStep ?? SUPERLIGHT_DPI_STEP
  const defaultIdx = state.sensor.defaultDpiIndex ?? 0
  const shiftIdx = state.sensor.dpiShiftIndex ?? 0

  return (
    <div className={css.page}>
      <div className={css.statusRow}>
        <label className={css.profileLabel}>
          <span>{pl ? 'Profil' : 'Profile'}</span>
          <select
            className={css.select}
            value={String(state.profileIndex)}
            aria-label={pl ? 'Profil onboard' : 'Onboard profile'}
            onChange={(e) => {
              void apply(async (d) => {
                await d.setProfile(Number(e.target.value))
              })
            }}
          >
            {Array.from({ length: profileCount }, (_, i) => (
              <option key={i} value={String(i)}>
                {pl ? `Profil ${i + 1}` : `Profile ${i + 1}`}
              </option>
            ))}
          </select>
        </label>
        <span className={css.statusBatt}>
          {batt != null ? `${batt}%` : '-'}
          {state.info.charging ? (pl ? ' · ładowanie' : ' · charging') : ''}
        </span>
        <span>LIGHTSPEED</span>
        <button
          type="button"
          className={css.statusLink}
          onClick={() => {
            void apply(async (d) => {
              await d.restoreDefaults()
            })
          }}
        >
          {pl ? 'Przywróć domyślne' : 'Restore defaults'}
        </button>
        <span className={css.statusSpacer} />
        {driver.lastVerifyNote ? (
          <span title={driver.lastVerifyNote}>
            {driver.mouseReachable
              ? pl
                ? 'Połączono'
                : 'Connected'
              : pl
                ? 'Brak odpowiedzi HID++'
                : 'No HID++ reply'}
          </span>
        ) : null}
      </div>

      <div className={css.mainGrid}>
        {/* DPI */}
        <section className={css.panel}>
          <h2 className={css.panelTitle}>DPI</h2>
          <div className={css.slotRow}>
            <select
              className={css.select}
              value={String(stageCount)}
              aria-label={pl ? 'Liczba gniazd DPI' : 'DPI slot count'}
              onChange={(e) => {
                void apply((d) => d.setDpiStageCount(Number(e.target.value)))
              }}
            >
              {Array.from({ length: SUPERLIGHT_DPI_MAX_STAGES }, (_, i) => i + 1).map(
                (n) => (
                  <option key={n} value={String(n)}>
                    {n}{' '}
                    {pl
                      ? n === 1
                        ? 'gniazdo'
                        : n < 5
                          ? 'gniazda'
                          : 'gniazd'
                      : n === 1
                        ? 'slot'
                        : 'slots'}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className={css.dpiList}>
            {stages.map((s) => {
              const active = s.index === state.sensor.activeDpiIndex
              const isDefault = s.index === defaultIdx
              const isShift = s.index === shiftIdx
              const enabled = s.index < stageCount
              return (
                <div
                  key={s.index}
                  className={`${css.dpiRow} ${active ? css.dpiRowActive : ''} ${
                    enabled ? css.dpiRowClickable : ''
                  }`}
                  style={{ opacity: enabled ? 1 : 0.35 }}
                  role={enabled ? 'button' : undefined}
                  tabIndex={enabled ? 0 : undefined}
                  title={
                    enabled
                      ? pl
                        ? 'Kliknij, aby ustawić jako aktualny DPI'
                        : 'Click to set as current DPI'
                      : undefined
                  }
                  onClick={() => {
                    if (!enabled || active) return
                    void apply((d) =>
                      (d as SuperlightDriver).setActiveDpiSlot(s.index),
                    )
                  }}
                  onKeyDown={(e) => {
                    if (!enabled || active) return
                    if (e.key !== 'Enter' && e.key !== ' ') return
                    e.preventDefault()
                    void apply((d) =>
                      (d as SuperlightDriver).setActiveDpiSlot(s.index),
                    )
                  }}
                >
                  <span className={css.dpiIndex}>{s.index + 1}</span>
                  <div className={css.dpiInputWrap}>
                    <input
                      className={css.dpiInput}
                      type="number"
                      min={dpiMin}
                      max={dpiMax}
                      step={dpiStep}
                      disabled={!enabled}
                      value={enabled ? s.value : ''}
                      placeholder={enabled ? undefined : '-'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        if (!Number.isFinite(n)) return
                        void apply((d) => d.setDpiStage(s.index, n))
                      }}
                    />
                    <span className={css.dpiBadges} aria-hidden>
                      {active ? (
                        <span className={css.dpiBadge} title={pl ? 'Aktualny' : 'Active'}>
                          ●
                        </span>
                      ) : null}
                      {isDefault ? (
                        <span
                          className={css.dpiBadge}
                          title={pl ? 'Domyślny' : 'Default'}
                        >
                          ★
                        </span>
                      ) : null}
                      {isShift ? (
                        <span
                          className={css.dpiBadge}
                          title={pl ? 'DPI Shift' : 'DPI Shift'}
                        >
                          ⇧
                        </span>
                      ) : null}
                    </span>
                    <div
                      className={css.dpiMenuWrap}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className={css.dpiMenuBtn}
                        title={pl ? 'Opcje DPI' : 'DPI options'}
                        disabled={!enabled}
                        aria-haspopup="menu"
                        aria-expanded={dpiMenu === s.index}
                        onClick={() =>
                          setDpiMenu((cur) => (cur === s.index ? null : s.index))
                        }
                      >
                        ⋮
                      </button>
                      {dpiMenu === s.index ? (
                        <div
                          ref={menuRef}
                          className={css.dpiMenu}
                          role="menu"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            className={css.dpiMenuItem}
                            disabled={active}
                            onClick={() => {
                              setDpiMenu(null)
                              void apply((d) =>
                                (d as SuperlightDriver).setActiveDpiSlot(s.index),
                              )
                            }}
                          >
                            <span className={css.dpiMenuCheck}>
                              {active ? '✓' : ''}
                            </span>
                            {pl
                              ? 'Ustaw jako aktualny DPI'
                              : 'Set as current DPI'}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className={css.dpiMenuItem}
                            disabled={isDefault}
                            onClick={() => {
                              setDpiMenu(null)
                              void apply((d) =>
                                (d as SuperlightDriver).setDefaultDpiSlot(
                                  s.index,
                                ),
                              )
                            }}
                          >
                            <span className={css.dpiMenuCheck}>
                              {isDefault ? '✓' : ''}
                            </span>
                            {pl
                              ? 'Ustaw jako profil domyślny'
                              : 'Set as default DPI'}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className={css.dpiMenuItem}
                            disabled={isShift}
                            onClick={() => {
                              setDpiMenu(null)
                              void apply((d) =>
                                (d as SuperlightDriver).setDpiShiftSlot(s.index),
                              )
                            }}
                          >
                            <span className={css.dpiMenuCheck}>
                              {isShift ? '✓' : ''}
                            </span>
                            {pl
                              ? 'Przypisz zmianę DPI'
                              : 'Assign DPI shift'}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className={`${css.dpiMenuItem} ${css.dpiMenuItemReset}`}
                            onClick={() => {
                              setDpiMenu(null)
                              void apply((d) =>
                                (d as SuperlightDriver).resetDpiSlot(s.index),
                              )
                            }}
                          >
                            <span className={css.dpiMenuCheck} />
                            {pl ? 'Resetuj' : 'Reset'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Center mouse */}
        <section className={css.center}>
          <img
            className={css.deviceImg}
            src={SUPERLIGHT_OEM.assets.device}
            alt={driver.identity.model}
            width={SUPERLIGHT_OEM.deviceDisplayWidth}
            draggable={false}
          />
          <p className={css.deviceName}>
            {driver.identity.brand} {driver.identity.model}
          </p>
          <div className={css.toolRow}>
            <button
              type="button"
              className={css.toolBtn}
              onClick={() => void disconnect()}
            >
              {pl ? 'Odłącz' : 'Disconnect'}
            </button>
            <button
              type="button"
              className={css.toolBtn}
              onClick={() => void refreshFromDevice()}
            >
              {pl ? 'Odśwież' : 'Refresh'}
            </button>
          </div>
        </section>

        {/* Assignments */}
        <section className={css.panel}>
          <h2 className={css.panelTitle}>
            {pl ? 'Przypisania' : 'Assignments'}
          </h2>
          <div className={css.assignTable}>
            <div className={css.assignHead}>
              <span>{pl ? 'Przycisk' : 'Button'}</span>
              <span>{pl ? 'Przypisanie' : 'Assignment'}</span>
            </div>
            {state.buttons.map((b) => {
              const locked = b.id === 1 || b.id === 2
              return (
                <div key={b.id} className={css.assignRow}>
                  <span className={css.assignNum}>{b.id}</span>
                  <select
                    className={`${css.select} ${css.assignSelect}`}
                    value={b.action}
                    disabled={locked}
                    onChange={(e) => {
                      void apply((d) =>
                        d.setButtonAction(
                          b.id,
                          e.target.value as ButtonAction,
                        ),
                      )
                    }}
                  >
                    {ACTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {tr(a.key)}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <section className={css.ratePanel}>
        <h2 className={css.rateTitle}>
          {pl ? 'Odświeżanie położenia' : 'Report rate'}
        </h2>
        <select
          className={`${css.select} ${css.rateSelect}`}
          value={String(state.sensor.reportRate)}
          onChange={(e) => {
            void apply((d) =>
              d.patchSensor({ reportRate: Number(e.target.value) }),
            )
          }}
        >
          {SUPERLIGHT_REPORT_RATES.map((hz) => (
            <option key={hz} value={String(hz)}>
              {hz} Hz
            </option>
          ))}
        </select>
      </section>
    </div>
  )
}
