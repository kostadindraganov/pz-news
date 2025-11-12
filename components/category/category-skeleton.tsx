export function CategoryArticlesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border bg-card">
          <div className="aspect-video w-full animate-pulse bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CategorySubcategoriesSkeleton() {
  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-9 w-24 animate-pulse rounded-full bg-muted"
        />
      ))}
    </nav>
  )
}
