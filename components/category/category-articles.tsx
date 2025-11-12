import { supabase } from '@/lib/supabase/client'
import { ArticleGrid } from '@/components/article/article-grid'

interface CategoryArticlesProps {
  categoryId: string
  categorySlug: string
  page: number
}

export async function CategoryArticles({ categoryId, categorySlug, page }: CategoryArticlesProps) {
  const limit = 12
  const offset = (page - 1) * limit

  // Get articles for this category
  const { data: articles, count } = await supabase
    .from('articles')
    .select('*, author:users(*), category:categories(*)', { count: 'exact' })
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const totalPages = Math.ceil((count || 0) / limit)

  if (!articles || articles.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted-foreground">
          Все още няма публикувани статии в тази категория.
        </p>
      </div>
    )
  }

  return (
    <>
      <ArticleGrid articles={articles} columns={3} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/${categorySlug}?page=${page - 1}`}
              className="rounded border px-4 py-2 transition-colors hover:bg-muted"
            >
              Предишна
            </a>
          )}
          <span className="flex items-center px-4 py-2 text-sm text-muted-foreground">
            Страница {page} от {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/${categorySlug}?page=${page + 1}`}
              className="rounded border px-4 py-2 transition-colors hover:bg-muted"
            >
              Следваща
            </a>
          )}
        </div>
      )}
    </>
  )
}
