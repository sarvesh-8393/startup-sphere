'use client'

import { useEffect } from 'react'

export default function ViewTrackerClient({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return
    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
    }).catch(() => {})
  }, [slug])
  return null
} 