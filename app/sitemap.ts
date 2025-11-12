import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Get all published articles
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, updated_at, category:categories(slug)')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  // Get all active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .eq('is_active', true)

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Category pages
  const categoryPages: MetadataRoute.Sitemap =
    categories?.map((category) => ({
      url: `${baseUrl}/${category.slug}`,
      lastModified: new Date(category.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })) || []

  // Article pages
  const articlePages: MetadataRoute.Sitemap =
    articles?.map((article) => ({
      url: `${baseUrl}/${article.category?.slug}/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || []

  return [...staticPages, ...categoryPages, ...articlePages]
}
