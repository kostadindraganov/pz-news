import { Suspense } from 'react'
import { CachedNewsSection } from './components/CachedNewsSection'
import { DynamicUserSection } from './components/DynamicUserSection'

/**
 * Next.js 16 Partial Prerendering (PPR) Demo
 * This page demonstrates the power of Cache Components:
 * - CachedNewsSection uses 'use cache' and will be prerendered
 * - DynamicUserSection executes at request time
 * - Together they create a partially prerendered page
 */
export default function HomePage() {
  return (
    <main className="min-h-screen p-8 sm:p-24">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="text-center">
          <h1 className="mb-4 text-4xl font-bold">
            PZ-News - Новини от Пазарджик
          </h1>
          <p className="text-lg text-muted-foreground">
            Регионална новинарска платформа
          </p>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Next.js 16 | Cache Components (PPR) | React 19 | TypeScript
            </p>
          </div>
        </header>

        <div className="rounded-lg border border-border bg-muted/40 p-6">
          <h2 className="mb-3 text-xl font-semibold">
            Partial Prerendering (PPR) Demo
          </h2>
          <p className="text-sm text-muted-foreground">
            Тази страница демонстрира новата функция Cache Components в Next.js
            16. Кешираната секция е предварително рендерана, докато
            динамичната се изпълнява при всяка заявка.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Cached component - wrapped in Suspense for PPR */}
          <Suspense
            fallback={
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
              </div>
            }
          >
            <CachedNewsSection />
          </Suspense>

          {/* Dynamic component - Client component using Date() needs Suspense in Next.js 16 */}
          <Suspense
            fallback={
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
              </div>
            }
          >
            <DynamicUserSection />
          </Suspense>
        </div>

        <footer className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by Next.js 16 with cacheComponents: true
          </p>
        </footer>
      </div>
    </main>
  )
}
