'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import { DEMO_BUTTONS } from '@/devices/mice/demo/identity'
import { FENRIR_MAX_BUTTONS } from '@/devices/mice/gwolves/fenrir-max/buttons'
import { BLITZ_ULTIMATE_BUTTONS } from '@/devices/mice/rampage/blitz-ultimate/buttons'
import { KING_ULTRA_BUTTONS } from '@/devices/mice/redragon/king-ultra/buttons'
import type { ButtonPosition, LayoutId } from '@/lib/layouts'
import { LAYOUT_META } from '@/lib/layouts'
import page from '@/views/ButtonsPage.module.css'

type ButtonMeta = { id: number; label: string; action: string }

function buttonMetaFor(layoutId: LayoutId): ButtonMeta[] {
  if (layoutId === 'umd-demo') {
    return DEMO_BUTTONS.map((b) => ({
      id: b.id,
      label: b.label,
      action: b.action,
    }))
  }
  if (layoutId === 'fenrir-max') {
    return FENRIR_MAX_BUTTONS.map((b) => ({
      id: b.id,
      label: b.label,
      action: b.action,
    }))
  }
  if (layoutId === 'blitz-ultimate') {
    return BLITZ_ULTIMATE_BUTTONS.map((b) => ({
      id: b.id,
      label: b.label,
      action: b.action,
    }))
  }
  // king-ultra + hero use the same 1–6 badge set
  return KING_ULTRA_BUTTONS.map((b) => ({
    id: b.id,
    label: b.label,
    action: b.action,
  }))
}

function defaultPositions(layoutId: LayoutId): ButtonPosition[] {
  if (layoutId === 'umd-demo') {
    return DEMO_BUTTONS.map((b) => ({ id: b.id, uiX: b.uiX, uiY: b.uiY }))
  }
  if (layoutId === 'fenrir-max') {
    return FENRIR_MAX_BUTTONS.map((b) => ({ id: b.id, uiX: b.uiX, uiY: b.uiY }))
  }
  if (layoutId === 'blitz-ultimate') {
    return BLITZ_ULTIMATE_BUTTONS.map((b) => ({
      id: b.id,
      uiX: b.uiX,
      uiY: b.uiY,
    }))
  }
  if (layoutId === 'king-ultra-hero') {
    return [
      { id: 1, uiX: 500, uiY: 640 },
      { id: 2, uiX: 700, uiY: 620 },
      { id: 3, uiX: 600, uiY: 520 },
      { id: 4, uiX: 380, uiY: 760 },
      { id: 5, uiX: 360, uiY: 900 },
      { id: 6, uiX: 720, uiY: 820 },
    ]
  }
  return KING_ULTRA_BUTTONS.map((b) => ({ id: b.id, uiX: b.uiX, uiY: b.uiY }))
}

function ensurePositions(
  layoutId: LayoutId,
  positions: ButtonPosition[],
): ButtonPosition[] {
  const meta = buttonMetaFor(layoutId)
  const defaults = defaultPositions(layoutId)
  return meta.map((m) => {
    const found = positions.find((p) => p.id === m.id)
    if (found) return found
    return defaults.find((d) => d.id === m.id) ?? { id: m.id, uiX: 0, uiY: 0 }
  })
}

export function AdminButtonsEditor({
  layoutId,
  initial,
}: {
  layoutId: LayoutId
  initial: ButtonPosition[]
}) {
  const meta = LAYOUT_META[layoutId]
  const buttonMeta = buttonMetaFor(layoutId)
  const [positions, setPositions] = useState(() =>
    ensurePositions(layoutId, initial),
  )
  const [dragId, setDragId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number>(buttonMeta[0]?.id ?? 1)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const byId = useMemo(() => {
    const m = new Map(positions.map((p) => [p.id, p]))
    return m
  }, [positions])

  function patchPos(id: number, patch: Partial<Pick<ButtonPosition, 'uiX' | 'uiY'>>) {
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const uiX =
          patch.uiX != null
            ? Math.round(Math.min(meta.width, Math.max(0, patch.uiX)))
            : p.uiX
        const uiY =
          patch.uiY != null
            ? Math.round(Math.min(meta.height, Math.max(0, patch.uiY)))
            : p.uiY
        return { ...p, uiX, uiY }
      }),
    )
  }

  function onPointerDown(id: number, e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragId(id)
    setSelectedId(id)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragId == null) return
    const wrap = e.currentTarget.querySelector(
      '[data-art]',
    ) as HTMLElement | null
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * meta.width
    const y = ((e.clientY - rect.top) / rect.height) * meta.height
    patchPos(dragId, { uiX: x, uiY: y })
  }

  function onPointerUp() {
    setDragId(null)
  }

  async function save() {
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/buttons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId, positions }),
      })
      if (!res.ok) {
        setStatus('Zapis nieudany')
        return
      }
      setStatus(`Zapisano pozycje przycisków (${layoutId})`)
    } catch {
      setStatus('Błąd sieci')
    } finally {
      setSaving(false)
    }
  }

  function resetDefaults() {
    setPositions(defaultPositions(layoutId))
  }

  const saveLabel =
    layoutId === 'king-ultra-hero'
      ? 'Zapisz pozycje hero'
      : layoutId === 'umd-demo'
        ? 'Zapisz pozycje demo'
        : layoutId === 'fenrir-max'
          ? 'Zapisz pozycje Fenrir Max'
          : 'Zapisz pozycje przycisków'

  return (
    <section className="panel" style={{ marginBottom: 16 }}>
      <h2 className="panel-label">{meta.label}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Ustaw pozycje badge’y 1–{buttonMeta.length} na grafice myszki. Przeciągnij
        numer albo wpisz X/Y. Canvas {meta.width}×{meta.height} ·{' '}
        <code className="mono">{meta.imageUrl}</code>
      </p>

      <div
        className={page.stage}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className={page.mouseWrap}
          data-art
          style={{
            width: 'min(520px, 100%)',
            aspectRatio: `${meta.width} / ${meta.height}`,
          }}
        >
          <img
            className={page.mouseArt}
            src={meta.imageUrl}
            alt={meta.label}
            width={meta.width}
            height={meta.height}
            draggable={false}
          />
          {buttonMeta.map(({ id }) => {
            const p = byId.get(id)
            if (!p) return null
            const active = dragId === id || selectedId === id
            return (
              <button
                key={id}
                type="button"
                className={`${page.badge} ${active ? page.badgeActive : ''}`}
                style={{
                  left: `${(p.uiX / meta.width) * 100}%`,
                  top: `${(p.uiY / meta.height) * 100}%`,
                  cursor: 'grab',
                  touchAction: 'none',
                }}
                title={buttonMeta.find((b) => b.id === id)?.label}
                onPointerDown={(e) => onPointerDown(id, e)}
              >
                {id}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        {buttonMeta.map((b) => {
          const p = byId.get(b.id)!
          const selected = selectedId === b.id
          return (
            <div
              key={b.id}
              className="row"
              style={{
                gap: 10,
                flexWrap: 'wrap',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: 8,
                border: selected
                  ? '1px solid var(--accent, #e8ff4d)'
                  : '1px solid var(--border)',
                background: selected
                  ? 'rgba(232, 255, 77, 0.06)'
                  : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedId(b.id)}
            >
              <strong style={{ minWidth: 28 }}>{b.id}</strong>
              <span style={{ minWidth: 120 }}>{b.label}</span>
              <span className="muted mono" style={{ minWidth: 72 }}>
                {b.action}
              </span>
              <label className="muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                X
                <input
                  type="number"
                  min={0}
                  max={meta.width}
                  value={p.uiX}
                  onChange={(e) =>
                    patchPos(b.id, { uiX: Number(e.target.value) || 0 })
                  }
                  style={{
                    width: 72,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    color: 'inherit',
                  }}
                />
              </label>
              <label className="muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                Y
                <input
                  type="number"
                  min={0}
                  max={meta.height}
                  value={p.uiY}
                  onChange={(e) =>
                    patchPos(b.id, { uiY: Number(e.target.value) || 0 })
                  }
                  style={{
                    width: 72,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    color: 'inherit',
                  }}
                />
              </label>
            </div>
          )
        })}
      </div>

      <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
        <Button variant="primary" disabled={saving} onClick={() => void save()}>
          {saving ? 'Zapisywanie…' : saveLabel}
        </Button>
        <Button onClick={resetDefaults}>Reset domyślnych</Button>
        {status && <span className="muted">{status}</span>}
      </div>
    </section>
  )
}
