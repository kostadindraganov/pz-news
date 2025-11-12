import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryBySlug, getAllCategories } from '@/lib/cache/queries'
import { supabase } from '@/lib/supabase/client'
import { ArticleGrid } from '@/components/article/article-grid'

// Generate static params for all categories at build time
export async function generateStaticParams() {
  const categories = await getAllCategories()

  return categories.map((category) => ({
    category: category.slug,
  }))
}

interface CategoryPageProps {
  params: Promise<{
    category: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  try {
    const { category: categorySlug } = await params
    const category = await getCategoryBySlug(categorySlug)

    return {
      title: `${category.name_bg} - Новини`,
      description: category.description || `Последни новини от категория ${category.name_bg}`,
      openGraph: {
        title: `${category.name_bg} - Новини`,
        description: category.description || `Последни новини от категория ${category.name_bg}`,
        type: 'website',
      },
    }
  } catch (error) {
    return {
      title: 'Категория не е намерена',
    }
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: categorySlug } = await params
  const resolvedSearchParams = await searchParams

  let category
  try {
    category = await getCategoryBySlug(categorySlug)
  } catch (error) {
    notFound()
  }

  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const limit = 12
  const offset = (page - 1) * limit

  // Get articles for this category
  const { data: articles, count } = await supabase
    .from('articles')
    .select('*, author:users(*), category:categories(*)', { count: 'exact' })
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const totalPages = Math.ceil((count || 0) / limit)

  // Get subcategories if this is a parent category
  const subcategories = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', category.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const subcategoryList = subcategories.data as any[] || []

  return (
    <div className="container py-8">
      {/* Category header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">{category.name_bg}</h1>
        {category.description && (
          <p className="text-lg text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Subcategories navigation */}
      {subcategoryList.length > 0 && (
        <nav className="mb-8 flex flex-wrap gap-2">
          {subcategoryList.map((subcategory: any) => (
            <a
              key={subcategory.id}
              href={`/${categorySlug}/${subcategory.slug}`}
              className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {subcategory.name_bg}
            </a>
          ))}
        </nav>
      )}

      {/* Articles grid */}
      {articles && articles.length > 0 ? (
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
      ) : (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">
            Все още няма публикувани статии в тази категория.
          </p>
        </div>
      )}
    </div>
  )
}
