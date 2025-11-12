export function FooterSkeleton() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">PZ-News</h3>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Categories Skeleton */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Категории</h3>
            <ul className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <li key={i}>
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Бързи връзки</h3>
            <ul className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <li key={i}>
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Контакти</h3>
            <ul className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <li key={i}>
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} PZ-News. Всички права запазени.</p>
        </div>
      </div>
    </footer>
  )
}
