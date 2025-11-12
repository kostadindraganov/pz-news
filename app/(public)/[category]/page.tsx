import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryBySlug, getAllCategories } from '@/lib/cache/queries'
import { CategoryArticles } from '@/components/category/category-articles'
import { CategorySubcategories } from '@/components/category/category-subcategories'
import { CategoryArticlesSkeleton, CategorySubcategoriesSkeleton } from '@/components/category/category-skeleton'

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
      <Suspense fallback={<CategorySubcategoriesSkeleton />}>
        <CategorySubcategories categoryId={category.id} categorySlug={categorySlug} />
      </Suspense>

      {/* Articles grid */}
      <Suspense fallback={<CategoryArticlesSkeleton />}>
        <CategoryArticles categoryId={category.id} categorySlug={categorySlug} page={page} />
      </Suspense>
    </div>
  )
}
