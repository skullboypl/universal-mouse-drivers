'use client'

import { useState } from 'react'
import { AdminButtonsEditor } from '@/components/admin/AdminButtonsEditor'
import type { ButtonPosition } from '@/lib/layouts'

type Tab = 'buttons' | 'blitz' | 'demo' | 'fenrir' | 'hero' | 'tray'

export function AdminDashboard({
  user,
  buttonsLayout,
  blitzLayout,
  demoLayout,
  fenrirLayout,
  heroLayout,
  tray,
}: {
  user: string
  buttonsLayout: ButtonPosition[]
  blitzLayout: ButtonPosition[]
  demoLayout: ButtonPosition[]
  fenrirLayout: ButtonPosition[]
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
            ['buttons', 'King Ultra'],
            ['blitz', 'Blitz Ultimate'],
            ['fenrir', 'Fenrir Max'],
            ['demo', 'Demo mouse'],
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
            Badge’y na stronie Buttons dla King Ultra (
            <code className="mono">/devices/king-ultra/mouse.png</code>).
          </p>
          <AdminButtonsEditor layoutId="king-ultra" initial={buttonsLayout} />
        </>
      )}

      {tab === 'blitz' && (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Badge’y Rampage Blitz Ultimate (
            <code className="mono">/devices/blitz-ultimate/mouse.png</code>).
          </p>
          <AdminButtonsEditor layoutId="blitz-ultimate" initial={blitzLayout} />
        </>
      )}

      {tab === 'fenrir' && (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Badge’y 1-5 pod G-Wolves Fenrir Max 8K (
            <code className="mono">/devices/fenrir-max/mouse.png</code> · 399×558).
            Pozycje z local admin trafiają do seed/defaults na produkcję.
          </p>
          <AdminButtonsEditor layoutId="fenrir-max" initial={fenrirLayout} />
        </>
      )}

      {tab === 'demo' && (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Badge’y na profilu demo (
            <code className="mono">/devices/demo/mouse.png</code> · 1536×1024).
          </p>
          <AdminButtonsEditor layoutId="umd-demo" initial={demoLayout} />
        </>
      )}

      {tab === 'hero' && (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Numery na hero Connect (
            <code className="mono">/brand/mouse-hero.png</code>).
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
