'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import styles from '@/components/ui.module.css'

export function AdminLoginForm() {
  const router = useRouter()
  const [user, setUser] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      })
      if (!res.ok) {
        setError('Błędny login lub hasło')
        return
      }
      router.refresh()
    } catch {
      setError('Błąd sieci')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={(e) => void onSubmit(e)}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Login</span>
        <input
          className={styles.input ?? undefined}
          style={{
            width: '100%',
            padding: '0.55rem 0.7rem',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}
          value={user}
          onChange={(e) => setUser(e.target.value)}
          autoComplete="username"
        />
      </label>
      <label className={styles.field} style={{ marginTop: 12 }}>
        <span className={styles.fieldLabel}>Hasło</span>
        <input
          type="password"
          style={{
            width: '100%',
            padding: '0.55rem 0.7rem',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      {error && (
        <p style={{ color: 'var(--danger)', marginTop: 12 }}>{error}</p>
      )}
      <div style={{ marginTop: 16 }}>
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? '…' : 'Zaloguj'}
        </Button>
      </div>
    </form>
  )
}
