'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClientRedirect } from '../components/ClientRedirect'
import { Button } from '../components/Button'
import { Select } from '../components/Select'
import styles from '../components/ui.module.css'
import { MOUSE_ART } from '../devices/mice/redragon/king-ultra/buttons'
import { OPENMOUSE_BACKED_ID } from '../devices/openmouse/constants'
import type { ButtonAction } from '../devices/types'
import { useLocale } from '../i18n/LocaleContext'
import type { MessageKey } from '../i18n/messages'
import { useT } from '../i18n/useT'
import { useDeviceSession } from '../session/DeviceSessionContext'
import page from './ButtonsPage.module.css'

type Pos = { id: number; uiX: number; uiY: number }

type ButtonActionGroup =
  | 'mouse'
  | 'system'
  | 'scroll'
  | 'dpi'
  | 'media'
  | 'lighting'
  | 'macro'

const GROUP_ORDER: ButtonActionGroup[] = [
  'mouse',
  'system',
  'scroll',
  'dpi',
  'media',
  'lighting',
]

const GROUP_LABEL: Record<ButtonActionGroup, MessageKey> = {
  mouse: 'buttons.group.mouse',
  system: 'buttons.group.system',
  scroll: 'buttons.group.scroll',
  dpi: 'buttons.group.dpi',
  media: 'buttons.group.media',
  lighting: 'buttons.group.lighting',
  macro: 'buttons.group.macro',
}

function actionMsg(id: ButtonAction): MessageKey {
  return `buttons.action.${id}` as MessageKey
}

export function ButtonsPage() {
  const { connected, state, driver, apply } = useDeviceSession()
  const { lp } = useLocale()
  const tr = useT()
  const [focusId, setFocusId] = useState<number | null>(null)
  const [layout, setLayout] = useState<Pos[] | null>(null)

  const catalogId = driver?.identity.id
  const isDemo = catalogId === 'umd-demo'
  const isBlitz = catalogId === 'rampage-blitz-ultimate'
  /** Always from the active driver - never a shared cross-SKU catalog. */
  const buttonActions = driver?.buttonActions ?? []
  const layoutId =
    isBlitz
      ? 'blitz-ultimate'
      : catalogId === 'gwolves-fenrir-max'
        ? 'fenrir-max'
        : isDemo
          ? 'umd-demo'
          : 'king-ultra'

  useEffect(() => {
    if (!connected || !driver) return
    let cancelled = false
    void fetch(`/api/buttons?layoutId=${layoutId}`)
      .then((r) => r.json())
      .then((data: { positions?: Pos[] }) => {
        if (!cancelled && Array.isArray(data.positions)) setLayout(data.positions)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [connected, driver, layoutId])

  const posById = useMemo(() => {
    const m = new Map<number, Pos>()
    for (const p of layout ?? []) m.set(p.id, p)
    return m
  }, [layout])

  if (!connected || !state || !driver) {
    return <ClientRedirect href={lp('/')} />
  }

  if (
    catalogId === OPENMOUSE_BACKED_ID &&
    driver.capabilities?.buttons !== true
  ) {
    return (
      <div className="page">
        <h1 className="page-title">{tr('buttons.title')}</h1>
        <p className="page-sub">{tr('buttons.omUnavailable')}</p>
        <div className="panel">
          <Link href={lp('/device/sensor')}>
            <Button>{tr('nav.sensor')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const mouseSrc = isDemo
    ? '/devices/demo/mouse.png'
    : (driver.identity.imageUrl ?? '/devices/king-ultra/mouse.png')
  const logoSrc = driver.identity.logoUrl
  const artW = driver.identity.artWidth ?? MOUSE_ART.width
  const artH = driver.identity.artHeight ?? MOUSE_ART.height

  return (
    <div className="page">
      <h1 className="page-title">{tr('buttons.title')}</h1>
      <p className="page-sub">{tr('buttons.sub')}</p>

      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{tr('buttons.profile')}</span>
            <Select
              value={String(state.profileIndex)}
              onChange={(e) => {
                void apply(async (d) => {
                  await d.setProfile(Number(e.target.value))
                })
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <option key={i} value={String(i)}>
                  {tr('buttons.profileN', { n: i + 1 })}
                </option>
              ))}
            </Select>
          </label>
          <div className="row">
            <Button onClick={() => void apply((d) => d.restoreDefaults())}>
              {tr('buttons.restore')}
            </Button>
            <Button
              onClick={() => {
                const blob = new Blob([driver.exportProfile()], {
                  type: 'application/json',
                })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `${driver.identity.id}-profile-${state.profileIndex + 1}.json`
                a.click()
              }}
            >
              {tr('buttons.export')}
            </Button>
            <Button
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'application/json'
                input.onchange = async () => {
                  const file = input.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  await apply((d) => {
                    d.importProfile(text)
                  })
                }
                input.click()
              }}
            >
              {tr('buttons.import')}
            </Button>
          </div>
        </div>
      </div>

      <div className={page.stage} style={{ marginTop: 16 }}>
        {logoSrc ? (
          <div className={page.logoWash} aria-hidden>
            <img src={logoSrc} alt="" draggable={false} />
          </div>
        ) : null}
        <div
          className={page.mouseWrap}
          style={{ aspectRatio: `${artW} / ${artH}` }}
        >
          <img
            className={page.mouseArt}
            src={mouseSrc}
            alt={driver.identity.model}
            width={artW}
            height={artH}
          />
          {state.buttons.map((b) => {
            // Admin layouts (king-ultra / umd-demo) override baked-in defaults.
            const pos = posById.get(b.id)
            const uiX = pos?.uiX ?? b.uiX
            const uiY = pos?.uiY ?? b.uiY
            return (
              <button
                key={b.id}
                type="button"
                className={`${page.badge} ${focusId === b.id ? page.badgeActive : ''}`}
                style={{
                  left: `${(uiX / artW) * 100}%`,
                  top: `${(uiY / artH) * 100}%`,
                }}
                title={`${b.id}. ${tr(actionMsg(b.action))}`}
                onClick={() => setFocusId(b.id)}
              >
                {b.id}
              </button>
            )
          })}
        </div>
        <p className={page.mapHint}>{tr('buttons.mapHint')}</p>
      </div>

      <div className={page.options}>
        <div className="panel">
          <h2 className="panel-label">{tr('buttons.keys')}</h2>
          <div className={page.bindList}>
            {state.buttons.map((b) => (
              <div
                key={b.id}
                className={`${page.bindRow} ${focusId === b.id ? page.bindRowActive : ''}`}
                onFocus={() => setFocusId(b.id)}
              >
                <span className={page.bindNum}>{b.id}</span>
                <Select
                  style={{ flex: 1 }}
                  value={b.action}
                  onChange={(e) => {
                    setFocusId(b.id)
                    const action = e.target.value as ButtonAction
                    void apply((d) => {
                      if (action === 'macro') {
                        const mid =
                          b.macroId ?? state.macros[0]?.id
                        d.setButtonAction(b.id, action, mid)
                      } else {
                        d.setButtonAction(b.id, action)
                      }
                    })
                  }}
                >
                  {GROUP_ORDER.map((group) => {
                    const items = buttonActions.filter(
                      (a) => a.group === group,
                    )
                    if (items.length === 0) return null
                    return (
                      <optgroup key={group} label={tr(GROUP_LABEL[group])}>
                        {items.map((a) => (
                          <option key={a.id} value={a.id}>
                            {tr(actionMsg(a.id))}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </Select>
                {b.action === 'macro' && (
                  <Select
                    style={{ flex: 1.2 }}
                    value={b.macroId ?? ''}
                    onChange={(e) => {
                      const mid = e.target.value || undefined
                      setFocusId(b.id)
                      void apply((d) =>
                        d.setButtonAction(b.id, 'macro', mid),
                      )
                    }}
                  >
                    <option value="">{tr('macro.select')}</option>
                    {state.macros.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-label">{tr('buttons.debounce')}</h2>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={state.sensor.debounceEnabled}
              onChange={(e) => {
                const on = e.target.checked
                void apply((d) =>
                  d.patchSensor({
                    debounceEnabled: on,
                    ...(on && state.sensor.debounceMs === 0
                      ? { debounceMs: 8 }
                      : {}),
                  }),
                )
              }}
            />
            {tr('buttons.debounceEnable')}
          </label>
          <div className="row" style={{ marginTop: 16 }}>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={16}
              step={1}
              disabled={!state.sensor.debounceEnabled}
              value={state.sensor.debounceMs}
              onChange={(e) => {
                void apply((d) =>
                  d.patchSensor({ debounceMs: Number(e.target.value) }),
                )
              }}
            />
            <span className="mono" style={{ color: 'var(--accent-hot)' }}>
              {state.sensor.debounceEnabled
                ? `${state.sensor.debounceMs}ms`
                : tr('buttons.off')}
            </span>
          </div>
          <p className="muted" style={{ marginTop: 14, fontSize: '0.85rem' }}>
            {tr('buttons.debounceTip')}
          </p>
        </div>
      </div>
    </div>
  )
}
