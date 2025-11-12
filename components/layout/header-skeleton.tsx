export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">PZ-News</span>
          </div>
        </div>

        {/* Desktop Navigation Skeleton */}
        <nav className="hidden md:flex items-center gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-4 w-16 animate-pulse rounded bg-muted"
            />
          ))}
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden h-9 w-9 animate-pulse rounded bg-muted" />
      </div>

      {/* Secondary navigation bar skeleton */}
      <div className="border-t bg-muted/40">
        <div className="container">
          <nav className="flex h-10 items-center gap-4 overflow-x-auto text-sm">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-4 w-16 animate-pulse rounded bg-muted"
              />
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
