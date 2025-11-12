import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArticleBySlug, getLatestArticles } from '@/lib/cache/queries'
import { supabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { ArticleGrid } from '@/components/article/article-grid'
import { Calendar, User, Eye, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Revalidate article pages every 60 seconds
export const revalidate = 60

// Enable dynamic params for articles not generated at build time
export const dynamicParams = true

interface ArticlePageProps {
  params: {
    category: string
    slug: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  try {
    const article = await getArticleBySlug(params.slug)

    return {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt || '',
      keywords: article.meta_keywords || [],
      authors: article.author ? [{ name: article.author.full_name }] : [],
      openGraph: {
        title: article.title,
        description: article.excerpt || '',
        type: 'article',
        publishedTime: article.published_at || undefined,
        authors: article.author ? [article.author.full_name] : [],
        images: article.featured_image_url
          ? [
              {
                url: article.featured_image_url,
                alt: article.featured_image_alt || article.title,
              },
            ]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: article.excerpt || '',
        images: article.featured_image_url ? [article.featured_image_url] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Статия не е намерена',
    }
  }
}

// Pre-generate popular article pages at build time
export async function generateStaticParams() {
  // Get the most recent 50 articles to pre-generate
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, category:categories(slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  if (!articles) return []

  return articles.map((article) => ({
    category: article.category?.slug || '',
    slug: article.slug,
  }))
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  let article
  try {
    article = await getArticleBySlug(params.slug)
  } catch (error) {
    notFound()
  }

  // Increment view count (fire and forget)
  supabase
    .from('articles')
    .update({ view_count: article.view_count + 1 })
    .eq('id', article.id)
    .then()

  // Get related articles from the same category
  const { data: relatedArticles } = await supabase
    .from('articles')
    .select('*, author:users(*), category:categories(*)')
    .eq('category_id', article.category_id)
    .eq('status', 'published')
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(3)

  return (
    <article className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Начало
        </Link>
        <span>/</span>
        {article.category && (
          <>
            <Link href={`/${article.category.slug}`} className="hover:text-primary">
              {article.category.name_bg}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{article.title}</span>
      </nav>

      <div className="mx-auto max-w-4xl">
        {/* Category badge */}
        {article.category && (
          <Link
            href={`/${article.category.slug}`}
            className="mb-4 inline-block rounded bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {article.category.name_bg}
          </Link>
        )}

        {/* Title */}
        <h1 className="mb-4 text-4xl font-bold leading-tight lg:text-5xl">{article.title}</h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="mb-6 text-xl text-muted-foreground">{article.subtitle}</p>
        )}

        {/* Meta info */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {article.author && (
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {article.author.full_name}
            </span>
          )}
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(article.published_at)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {article.view_count} прегледа
          </span>
        </div>

        {/* Share buttons */}
        <div className="mb-8 flex items-center gap-2">
          <span className="text-sm font-medium">Сподели:</span>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Featured image */}
        {article.featured_image_url && (
          <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src={article.featured_image_url}
              alt={article.featured_image_alt || article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Article content */}
        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.meta_keywords && article.meta_keywords.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="text-sm font-medium">Тагове:</span>
            {article.meta_keywords.map((keyword, index) => (
              <span
                key={index}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Related articles */}
      {relatedArticles && relatedArticles.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Свързани статии</h2>
          <ArticleGrid articles={relatedArticles} columns={3} />
        </section>
      )}
    </article>
  )
}
