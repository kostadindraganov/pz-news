'use client'

import { useState, useEffect } from 'react'

/**
 * Example of a dynamic client component WITHOUT caching
 * This demonstrates the contrast with cached server components
 * for Partial Prerendering (PPR) in Next.js 16
 */

export function DynamicUserSection() {
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleString('bg-BG')
  )

  // Update time on the client side every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('bg-BG'))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-2xl font-bold">
        Динамично съдържание (Request Time)
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Този клиентски компонент обновява времето на всяка секунда
      </p>
      <div className="rounded border border-border bg-background p-3">
        <p className="text-sm text-muted-foreground">Текущо време:</p>
        <p className="font-mono text-lg font-semibold">
          {currentTime || 'Зареждане...'}
        </p>
      </div>
    </section>
  )
}
