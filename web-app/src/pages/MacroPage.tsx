import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Select } from '../components/Select'
import styles from '../components/ui.module.css'
import type { Macro, MacroEvent, MacroPlayMode } from '../devices/types'
import { useLocale } from '../i18n/LocaleContext'
import { useT } from '../i18n/useT'
import { useDeviceSession } from '../session/DeviceSessionContext'

function uid() {
  return crypto.randomUUID()
}

export function MacroPage() {
  const { connected, state, apply } = useDeviceSession()
  const { lp } = useLocale()
  const tr = useT()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)

  if (!connected || !state) return <Navigate to={lp('/')} replace />

  const selected = state.macros.find((m) => m.id === selectedId) ?? null

  function updateMacro(next: Macro) {
    const macros = state!.macros.map((m) => (m.id === next.id ? next : m))
    void apply((d) => {
      d.setMacros(macros)
    })
  }

  function newMacro() {
    const m: Macro = {
      id: uid(),
      name: tr('macro.namePrefix', { n: state!.macros.length + 1 }),
      events: [],
      playMode: 'until_released',
      times: 1,
      autoDelay: true,
      defaultDelayMs: 10,
    }
    void apply((d) => {
      d.setMacros([...state!.macros, m])
    })
    setSelectedId(m.id)
  }

  return (
    <div className="page">
      <h1 className="page-title">{tr('macro.title')}</h1>
      <p className="page-sub">{tr('macro.sub')}</p>

      <div className="grid-2">
        <div className="panel">
          <h2 className="panel-label">{tr('macro.list')}</h2>
          <div
            style={{
              minHeight: 220,
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              overflow: 'auto',
            }}
          >
            {state.macros.length === 0 && (
              <p className="muted" style={{ padding: 16, margin: 0 }}>
                {tr('macro.empty')}
              </p>
            )}
            {state.macros.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  background:
                    m.id === selectedId ? 'var(--accent-soft)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <Button variant="primary" onClick={newMacro}>
              {tr('macro.new')}
            </Button>
            <Button
              disabled={!selected}
              onClick={() => {
                if (!selected) return
                void apply((d) => {
                  d.setMacros(state.macros.filter((m) => m.id !== selected.id))
                })
                setSelectedId(null)
              }}
            >
              {tr('macro.delete')}
            </Button>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-label">{tr('macro.keys')}</h2>
          <div
            style={{
              minHeight: 220,
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              fontFamily: 'var(--mono)',
              fontSize: '0.8rem',
              overflow: 'auto',
            }}
          >
            {!selected && (
              <p className="muted" style={{ padding: 16, margin: 0 }}>
                {tr('macro.selectOrCreate')}
              </p>
            )}
            {selected?.events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {ev.kind === 'delay'
                  ? tr('macro.delayMs', { n: ev.delayMs ?? 0 })
                  : `${ev.kind.toUpperCase()} ${ev.key}`}
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <Button
              disabled={!selected}
              onClick={() => {
                if (!selected) return
                const events = [...selected.events]
                events.pop()
                updateMacro({ ...selected, events })
              }}
            >
              {tr('macro.deleteLast')}
            </Button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Button
            variant="primary"
            disabled={!selected}
            onClick={() => {
              if (!selected) return
              setRecording((r) => !r)
            }}
          >
            {recording ? tr('macro.stop') : tr('macro.start')}
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (!selected) return
              setRecording(false)
            }}
          >
            {tr('macro.save')}
          </Button>
        </div>

        {selected && (
          <div
            tabIndex={0}
            onKeyDown={(e) => {
              if (!recording || !selected) return
              e.preventDefault()
              const events: MacroEvent[] = [...selected.events]
              if (selected.autoDelay && events.length > 0) {
                events.push({
                  id: uid(),
                  kind: 'delay',
                  delayMs: selected.defaultDelayMs,
                })
              }
              events.push({ id: uid(), kind: 'down', key: e.code })
              updateMacro({ ...selected, events })
            }}
            onKeyUp={(e) => {
              if (!recording || !selected) return
              e.preventDefault()
              updateMacro({
                ...selected,
                events: [
                  ...selected.events,
                  { id: uid(), kind: 'up', key: e.code },
                ],
              })
            }}
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 8,
              border: recording
                ? '1px solid var(--accent)'
                : '1px dashed var(--border)',
              outline: 'none',
            }}
          >
            <p className="muted" style={{ margin: '0 0 14px' }}>
              {recording
                ? tr('macro.recordingHint')
                : tr('macro.recordingIdle')}
            </p>
            <div className="row">
              <label className={styles.check}>
                <input
                  type="radio"
                  checked={selected.autoDelay}
                  onChange={() => updateMacro({ ...selected, autoDelay: true })}
                />
                {tr('macro.autoDelay')}
              </label>
              <label className={styles.check}>
                <input
                  type="radio"
                  checked={!selected.autoDelay}
                  onChange={() =>
                    updateMacro({ ...selected, autoDelay: false })
                  }
                />
                {tr('macro.defaultDelay')}
              </label>
              <input
                className="mono"
                style={{
                  width: 72,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '0.4rem',
                }}
                value={selected.defaultDelayMs}
                onChange={(e) =>
                  updateMacro({
                    ...selected,
                    defaultDelayMs: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              {(
                [
                  ['until_released', 'macro.playUntilReleased'],
                  ['until_pressed', 'macro.playUntilPressed'],
                  ['until_this_key', 'macro.playUntilThisKey'],
                  ['times', 'macro.playTimes'],
                ] as const
              ).map(([value, key]) => (
                <label key={value} className={styles.check}>
                  <input
                    type="radio"
                    checked={selected.playMode === value}
                    onChange={() =>
                      updateMacro({
                        ...selected,
                        playMode: value as MacroPlayMode,
                      })
                    }
                  />
                  {tr(key)}
                </label>
              ))}
              <input
                className="mono"
                style={{
                  width: 56,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '0.4rem',
                }}
                disabled={selected.playMode !== 'times'}
                value={selected.times}
                onChange={(e) =>
                  updateMacro({
                    ...selected,
                    times: Number(e.target.value) || 1,
                  })
                }
              />
            </div>
            <label className={styles.field} style={{ marginTop: 12 }}>
              <span className={styles.fieldLabel}>
                {tr('macro.insertAction')}
              </span>
              <Select
                onChange={(e) => {
                  const v = e.target.value
                  if (!v) return
                  const events = [...selected.events]
                  if (v === 'delay') {
                    events.push({ id: uid(), kind: 'delay', delayMs: 10 })
                  } else {
                    events.push({ id: uid(), kind: 'down', key: v })
                    events.push({ id: uid(), kind: 'up', key: v })
                  }
                  updateMacro({ ...selected, events })
                  e.target.value = ''
                }}
                defaultValue=""
              >
                <option value="">{tr('macro.select')}</option>
                <option value="delay">{tr('macro.delay')}</option>
                <option value="KeyA">{tr('macro.keyA')}</option>
                <option value="Space">{tr('macro.space')}</option>
                <option value="ControlLeft">{tr('macro.ctrl')}</option>
              </Select>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
