'use cache'

/**
 * Example of component-level caching using Next.js 16 Cache Components
 * This component demonstrates how to use the 'use cache' directive
 * to cache component output for Partial Prerendering (PPR)
 */

interface NewsItem {
  id: string
  title: string
  category: string
}

async function fetchNewsItems(): Promise<NewsItem[]> {
  // Simulating a data fetch
  // In production, this would be a database query or API call
  await new Promise((resolve) => setTimeout(resolve, 100))

  return [
    {
      id: '1',
      title: 'Важна новина от Пазарджик',
      category: 'Местни новини',
    },
    {
      id: '2',
      title: 'Културно събитие в региона',
      category: 'Култура',
    },
    {
      id: '3',
      title: 'Икономически новини',
      category: 'Икономика',
    },
  ]
}

export async function CachedNewsSection() {
  const newsItems = await fetchNewsItems()

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-2xl font-bold">
        Кеширани новини (Cache Components)
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Този компонент използва директивата &apos;use cache&apos; за оптимизация
      </p>
      <ul className="space-y-3">
        {newsItems.map((item) => (
          <li
            key={item.id}
            className="rounded border border-border bg-background p-3"
          >
            <span className="text-xs text-muted-foreground">
              {item.category}
            </span>
            <h3 className="font-semibold">{item.title}</h3>
          </li>
        ))}
      </ul>
    </section>
  )
}
