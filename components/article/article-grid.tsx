import { ArticleCard } from './article-card'

interface Article {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  content: string
  featured_image_url?: string | null
  featured_image_alt?: string | null
  published_at?: string | null
  view_count?: number | null
  author?: {
    full_name: string
  } | null
  category?: {
    name_bg: string
    slug: string
  } | null
}

interface ArticleGridProps {
  articles: Article[]
  columns?: 2 | 3 | 4
}

export function ArticleGrid({ articles, columns = 3 }: ArticleGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid gap-6 ${gridClasses[columns]}`}>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}
