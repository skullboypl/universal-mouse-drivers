'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import type { ButtonPosition, LayoutId } from '@/lib/store'
import { LAYOUT_META } from '@/lib/store'
import page from '@/views/ButtonsPage.module.css'

export function AdminButtonsEditor({
  layoutId,
  initial,
}: {
  layoutId: LayoutId
  initial: ButtonPosition[]
}) {
  const meta = LAYOUT_META[layoutId]
  const [positions, setPositions] = useState(initial)
  const [dragId, setDragId] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const byId = useMemo(() => {
    const m = new Map(positions.map((p) => [p.id, p]))
    return m
  }, [positions])

  function onPointerDown(id: number, e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragId(id)
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
    const uiX = Math.round(Math.min(meta.width, Math.max(0, x)))
    const uiY = Math.round(Math.min(meta.height, Math.max(0, y)))
    setPositions((prev) =>
      prev.map((p) => (p.id === dragId ? { ...p, uiX, uiY } : p)),
    )
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
      setStatus(`Zapisano ${layoutId} → umd-store.json`)
    } catch {
      setStatus('Błąd sieci')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel" style={{ marginBottom: 16 }}>
      <h2 className="panel-label">{meta.label} - badge 1–6</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Przeciągnij numery. Przestrzeń {meta.width}×{meta.height} ·{' '}
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
          {[1, 2, 3, 4, 5, 6].map((id) => {
            const p = byId.get(id)
            if (!p) return null
            return (
              <button
                key={id}
                type="button"
                className={`${page.badge} ${dragId === id ? page.badgeActive : ''}`}
                style={{
                  left: `${(p.uiX / meta.width) * 100}%`,
                  top: `${(p.uiY / meta.height) * 100}%`,
                  cursor: 'grab',
                  touchAction: 'none',
                }}
                onPointerDown={(e) => onPointerDown(id, e)}
              >
                {id}
              </button>
            )
          })}
        </div>
      </div>

      <pre
        className="mono muted"
        style={{
          marginTop: 16,
          padding: 12,
          background: 'var(--bg-elevated)',
          borderRadius: 8,
          overflow: 'auto',
          maxHeight: 160,
        }}
      >
        {JSON.stringify(positions, null, 2)}
      </pre>

      <div className="row" style={{ marginTop: 12 }}>
        <Button variant="primary" disabled={saving} onClick={() => void save()}>
          {saving ? 'Zapisywanie…' : `Zapisz ${layoutId === 'king-ultra-hero' ? 'hero' : 'przyciski'}`}
        </Button>
        {status && <span className="muted">{status}</span>}
      </div>
    </section>
  )
}
