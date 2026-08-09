'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function ClientRedirect({ href }: { href: string }) {
  const router = useRouter()
  useEffect(() => {
    router.replace(href)
  }, [router, href])
  return (
    <p className="muted" style={{ padding: 24 }}>
      …
    </p>
  )
}
