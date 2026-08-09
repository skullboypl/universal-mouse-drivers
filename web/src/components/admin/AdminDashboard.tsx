'use client'

import { useState } from 'react'
import { AdminButtonsEditor } from '@/components/admin/AdminButtonsEditor'
import type { ButtonPosition } from '@/lib/layouts'

type Tab = 'buttons' | 'hero' | 'tray'

export function AdminDashboard({
  user,
  buttonsLayout,
  heroLayout,
  tray,
}: {
  user: string
  buttonsLayout: ButtonPosition[]
  heroLayout: ButtonPosition[]
  tray: {
    present: boolean
    source: string
    downloadsPath: string
    filename: string
    signed: boolean
    version: string
  }
}) {
  const [tab, setTab] = useState<Tab>('buttons')

  return (
    <>
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <div>
          <h1 className="page-title">UMD Admin</h1>
          <p className="page-sub">Zalogowano jako {user}</p>
        </div>
      </header>

      <nav
        className="row"
        style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
        aria-label="Admin sections"
      >
        {(
          [
            ['buttons', 'Przyciski na myszce'],
            ['hero', 'Hero connect'],
            ['tray', 'Tray .exe'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: 8,
              border:
                tab === id
                  ? '1px solid var(--accent, #e8ff4d)'
                  : '1px solid var(--border)',
              background:
                tab === id ? 'rgba(232, 255, 77, 0.12)' : 'var(--bg-elevated)',
              color: 'inherit',
              fontWeight: tab === id ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'buttons' && (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Pozycje badge’y na stronie Buttons (OEM mouse.png) — przeciągnij na
            grafice albo ustaw X/Y.
          </p>
          <AdminButtonsEditor layoutId="king-ultra" initial={buttonsLayout} />
        </>
      )}

      {tab === 'hero' && (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Pozycje numerów na hero Connect (mouse-hero.png).
          </p>
          <AdminButtonsEditor layoutId="king-ultra-hero" initial={heroLayout} />
        </>
      )}

      {tab === 'tray' && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <h2 className="panel-label">Tray Battery (.exe)</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Źródło: <code className="mono">{tray.source}</code>
            <br />
            Override (opcjonalnie):{' '}
            <code className="mono">
              {tray.downloadsPath}/{tray.filename}
            </code>
          </p>
          <p className="mono">
            status:{' '}
            {tray.present
              ? 'OK - dostępny do pobrania'
              : 'BRAK - brak w bundled-downloads i persistent'}
            {tray.signed ? ' · EV signed' : ' · unsigned'}
            {tray.version ? ` · v${tray.version}` : ''}
          </p>
          <p style={{ marginBottom: 0 }}>
            Public URL:{' '}
            <a href={`/api/downloads/${tray.filename}`}>
              /api/downloads/{tray.filename}
            </a>
          </p>
        </section>
      )}
    </>
  )
}
