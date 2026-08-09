'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'

export function AdminLogoutButton() {
  const router = useRouter()
  return (
    <Button
      onClick={() => {
        void fetch('/api/admin/logout', { method: 'POST' }).then(() => {
          router.refresh()
        })
      }}
    >
      Wyloguj
    </Button>
  )
}
