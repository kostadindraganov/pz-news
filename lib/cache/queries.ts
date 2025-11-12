import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { supabase } from '@/lib/supabase/client'

/**
 * React Cache - Deduplicates database queries within a single request
 * These functions will only execute once per request, even if called multiple times
 */

// Get article by ID with React cache
export const getArticleById = cache(async (id: string) => {
  const { data, error } = await supabase
    .from('articles')
    .select('*, author:users(*), category:categories(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
})

// Get article by slug with React cache
export const getArticleBySlug = cache(async (slug: string) => {
  const { data, error } = await supabase
    .from('articles')
    .select('*, author:users(*), category:categories(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) throw error
  return data
})

// Get category by slug with React cache
export const getCategoryBySlug = cache(async (slug: string) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) throw error
  return data
})

// Get all categories with React cache
export const getAllCategories = cache(async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data
})

/**
 * unstable_cache - Cache expensive operations across requests
 * These are cached persistently and can be revalidated on-demand
 */

// Get trending articles (cached for 2 minutes)
export const getTrendingArticles = unstable_cache(
  async (limit: number = 10) => {
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:users(*), category:categories(*)')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },
  ['trending-articles'],
  {
    revalidate: 120, // 2 minutes
    tags: ['trending-articles', 'articles'],
  }
)

// Get featured articles (cached for 30 seconds)
export const getFeaturedArticles = unstable_cache(
  async (limit: number = 5) => {
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:users(*), category:categories(*)')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },
  ['featured-articles'],
  {
    revalidate: 30, // 30 seconds
    tags: ['featured-articles', 'articles'],
  }
)

// Get latest articles (cached for 30 seconds)
export const getLatestArticles = unstable_cache(
  async (limit: number = 10) => {
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:users(*), category:categories(*)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },
  ['latest-articles'],
  {
    revalidate: 30, // 30 seconds
    tags: ['latest-articles', 'articles'],
  }
)

// Get articles by category (cached for 5 minutes)
export const getArticlesByCategory = unstable_cache(
  async (categoryId: string, limit: number = 20, offset: number = 0) => {
    const { data, error, count } = await supabase
      .from('articles')
      .select('*, author:users(*), category:categories(*)', { count: 'exact' })
      .eq('category_id', categoryId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return { articles: data, total: count || 0 }
  },
  ['articles-by-category'],
  {
    revalidate: 300, // 5 minutes
    tags: ['articles', 'categories'],
  }
)

// Get category article count (cached for 1 hour)
export const getCategoryArticleCount = unstable_cache(
  async (categoryId: string) => {
    const { count, error } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('status', 'published')

    if (error) throw error
    return count || 0
  },
  ['category-article-count'],
  {
    revalidate: 3600, // 1 hour
    tags: ['articles', 'categories'],
  }
)

// Get breaking news (cached for 1 minute)
export const getBreakingNews = unstable_cache(
  async (limit: number = 3) => {
    const { data, error } = await supabase
      .from('articles')
      .select('*, author:users(*), category:categories(*)')
      .eq('status', 'published')
      .eq('is_breaking', true)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },
  ['breaking-news'],
  {
    revalidate: 60, // 1 minute
    tags: ['breaking-news', 'articles'],
  }
)

// Get articles by tag (cached for 5 minutes)
export const getArticlesByTag = unstable_cache(
  async (tagSlug: string, limit: number = 20) => {
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', tagSlug)
      .single()

    if (tagError) throw tagError

    const { data, error } = await supabase
      .from('article_tags')
      .select('article:articles(*, author:users(*), category:categories(*))')
      .eq('tag_id', tag.id)
      .limit(limit)

    if (error) throw error
    return data.map((item: any) => item.article)
  },
  ['articles-by-tag'],
  {
    revalidate: 300, // 5 minutes
    tags: ['articles', 'tags'],
  }
)
