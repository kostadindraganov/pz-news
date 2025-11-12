import { Suspense } from 'react'
import { ArticleCard } from '@/components/article/article-card'
import { ArticleGrid } from '@/components/article/article-grid'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getFeaturedArticles,
  getLatestArticles,
  getBreakingNews,
  getTrendingArticles,
} from '@/lib/cache/queries'

// Revalidate every 30 seconds
export const revalidate = 30

export default function HomePage() {
  return (
    <div className="container py-8">
      {/* Breaking News */}
      <Suspense fallback={<BreakingNewsSkeleton />}>
        <BreakingNews />
      </Suspense>

      {/* Featured Article */}
      <section className="mt-8">
        <Suspense fallback={<FeaturedArticleSkeleton />}>
          <FeaturedArticles />
        </Suspense>
      </section>

      {/* Latest and Trending in Two Columns */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {/* Latest Articles - 2 columns */}
        <div className="lg:col-span-2">
          <h2 className="mb-6 text-2xl font-bold">Последни новини</h2>
          <Suspense fallback={<ArticleGridSkeleton />}>
            <LatestArticles />
          </Suspense>
        </div>

        {/* Trending Sidebar - 1 column */}
        <div>
          <h2 className="mb-6 text-2xl font-bold">Популярни</h2>
          <Suspense fallback={<TrendingSkeleton />}>
            <TrendingArticles />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// Streaming Components

async function BreakingNews() {
  const breakingNews = await getBreakingNews(3)

  if (!breakingNews || breakingNews.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border-2 border-destructive bg-destructive/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-destructive px-3 py-1 text-sm font-bold text-destructive-foreground">
          СПЕШНО
        </span>
        <h2 className="text-lg font-bold">Извънредни новини</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {breakingNews.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}

async function FeaturedArticles() {
  const featured = await getFeaturedArticles(1)

  if (!featured || featured.length === 0) {
    return null
  }

  return <ArticleCard article={featured[0]} featured />
}

async function LatestArticles() {
  const articles = await getLatestArticles(6)

  if (!articles || articles.length === 0) {
    return <p className="text-muted-foreground">Няма налични статии</p>
  }

  return <ArticleGrid articles={articles} columns={2} />
}

async function TrendingArticles() {
  const trending = await getTrendingArticles(5)

  if (!trending || trending.length === 0) {
    return <p className="text-sm text-muted-foreground">Няма популярни статии</p>
  }

  return (
    <div className="space-y-4">
      {trending.map((article, index) => (
        <div key={article.id} className="flex gap-3">
          <span className="text-3xl font-bold text-primary/20">{index + 1}</span>
          <div className="flex-1">
            <a
              href={`/${article.category?.slug}/${article.slug}`}
              className="line-clamp-2 font-medium hover:text-primary"
            >
              {article.title}
            </a>
            <p className="mt-1 text-xs text-muted-foreground">
              {article.view_count} прегледа
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Loading Skeletons

function BreakingNewsSkeleton() {
  return (
    <section className="rounded-lg border-2 border-destructive bg-destructive/5 p-4">
      <Skeleton className="mb-3 h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </section>
  )
}

function FeaturedArticleSkeleton() {
  return <Skeleton className="h-[400px] w-full rounded-lg" />
}

function ArticleGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-80" />
      ))}
    </div>
  )
}

function TrendingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  )
}
