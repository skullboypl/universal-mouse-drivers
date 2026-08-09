'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import { MOUSE_ART } from '@/devices/redragon-king-ultra/buttons'
import type { ButtonPosition } from '@/lib/store'
import page from '@/views/ButtonsPage.module.css'

export function AdminButtonsEditor({
  initial,
}: {
  initial: ButtonPosition[]
}) {
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

  function onPointerMove(
    e: React.PointerEvent<HTMLDivElement>,
  ) {
    if (dragId == null) return
    const wrap = e.currentTarget.querySelector('[data-art]') as HTMLElement | null
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * MOUSE_ART.width
    const y = ((e.clientY - rect.top) / rect.height) * MOUSE_ART.height
    const uiX = Math.round(Math.min(MOUSE_ART.width, Math.max(0, x)))
    const uiY = Math.round(Math.min(MOUSE_ART.height, Math.max(0, y)))
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
        body: JSON.stringify({ positions }),
      })
      if (!res.ok) {
        setStatus('Zapis nieudany')
        return
      }
      setStatus('Zapisano do /app/data/umd-store.json')
    } catch {
      setStatus('Błąd sieci')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel">
      <h2 className="panel-label">Pozycje badge 1–6 (przeciągnij)</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Współrzędne w przestrzeni zdjęcia {MOUSE_ART.width}×{MOUSE_ART.height}.
        Po zapisie UI Przyciski bierze je z API.
      </p>

      <div
        className={page.stage}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div className={page.mouseWrap} data-art>
          <img
            className={page.mouseArt}
            src="/devices/king-ultra/mouse.png"
            alt="King Ultra"
            width={MOUSE_ART.width}
            height={MOUSE_ART.height}
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
                  left: `${(p.uiX / MOUSE_ART.width) * 100}%`,
                  top: `${(p.uiY / MOUSE_ART.height) * 100}%`,
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
        }}
      >
        {JSON.stringify(positions, null, 2)}
      </pre>

      <div className="row" style={{ marginTop: 12 }}>
        <Button variant="primary" disabled={saving} onClick={() => void save()}>
          {saving ? 'Zapisywanie…' : 'Zapisz pozycje'}
        </Button>
        {status && <span className="muted">{status}</span>}
      </div>
    </section>
  )
}
