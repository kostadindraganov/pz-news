import { supabaseAdmin } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import { articleSchema } from '@/lib/validations/article'
import { revalidateTag, revalidatePath } from 'next/cache'
import { z } from 'zod'

export type ArticleCreateInput = z.infer<typeof articleSchema>

export type ArticleUpdateInput = Partial<ArticleCreateInput> & {
  id: string
}

/**
 * Create a new article
 */
export async function createArticle(input: ArticleCreateInput, authorId: string) {
  try {
    // Validate input
    const validatedData = articleSchema.parse(input)

    // Generate slug from title if not provided
    const slug = validatedData.slug || generateSlug(validatedData.title)

    // Check if slug already exists
    const { data: existingArticle } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingArticle) {
      throw new Error('Article with this slug already exists')
    }

    // Create article
    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert({
        slug,
        title: validatedData.title,
        subtitle: validatedData.subtitle,
        excerpt: validatedData.excerpt,
        content: validatedData.content,
        category_id: validatedData.categoryId,
        author_id: authorId,
        status: validatedData.status || 'draft',
        is_featured: validatedData.isFeatured || false,
        is_breaking: validatedData.isBreaking || false,
        featured_image_id: validatedData.featuredImageId,
        published_at: validatedData.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to create article')
    }

    // Revalidate relevant caches
    revalidateTag('articles')
    revalidateTag('featured-articles')
    revalidatePath('/admin/articles')
    revalidatePath('/')

    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update an existing article
 */
export async function updateArticle(input: ArticleUpdateInput, authorId: string) {
  try {
    const { id, ...updateData } = input

    // Check if article exists and user has permission
    const { data: existingArticle, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('*, author:users(role)')
      .eq('id', id)
      .single()

    if (fetchError || !existingArticle) {
      throw new Error('Article not found')
    }

    // Check permissions (authors can only edit their own articles)
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authorId)
      .single()

    const isAdmin = currentUser?.role === 'admin'
    const isEditor = currentUser?.role === 'editor'
    const isOwner = existingArticle.author_id === authorId

    if (!isAdmin && !isEditor && !isOwner) {
      throw new Error('Permission denied')
    }

    // Build update object
    const updateObject: any = {
      updated_at: new Date().toISOString(),
    }

    if (updateData.title) {
      updateObject.title = updateData.title
      // Regenerate slug if title changed
      updateObject.slug = generateSlug(updateData.title)
    }
    if (updateData.subtitle !== undefined) updateObject.subtitle = updateData.subtitle
    if (updateData.excerpt !== undefined) updateObject.excerpt = updateData.excerpt
    if (updateData.content !== undefined) updateObject.content = updateData.content
    if (updateData.categoryId) updateObject.category_id = updateData.categoryId
    if (updateData.status) {
      updateObject.status = updateData.status
      // Set published_at when publishing for the first time
      if (updateData.status === 'published' && !existingArticle.published_at) {
        updateObject.published_at = new Date().toISOString()
      }
    }
    if (updateData.isFeatured !== undefined) updateObject.is_featured = updateData.isFeatured
    if (updateData.isBreaking !== undefined) updateObject.is_breaking = updateData.isBreaking
    if (updateData.featuredImageId !== undefined) updateObject.featured_image_id = updateData.featuredImageId

    // Update article
    const { data, error } = await supabaseAdmin
      .from('articles')
      .update(updateObject)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to update article')
    }

    // Revalidate caches
    revalidateTag('articles')
    revalidateTag('featured-articles')
    revalidateTag(`article-${existingArticle.slug}`)
    revalidatePath('/admin/articles')
    revalidatePath(`/${existingArticle.category_id}/${existingArticle.slug}`)
    revalidatePath('/')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete an article
 */
export async function deleteArticle(id: string, userId: string) {
  try {
    // Check if article exists and user has permission
    const { data: existingArticle, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('*, author:users(role)')
      .eq('id', id)
      .single()

    if (fetchError || !existingArticle) {
      throw new Error('Article not found')
    }

    // Check permissions
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    const isAdmin = currentUser?.role === 'admin'
    const isOwner = existingArticle.author_id === userId

    if (!isAdmin && !isOwner) {
      throw new Error('Permission denied')
    }

    // Delete article
    const { error } = await supabaseAdmin
      .from('articles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to delete article')
    }

    // Revalidate caches
    revalidateTag('articles')
    revalidateTag('featured-articles')
    revalidateTag(`article-${existingArticle.slug}`)
    revalidatePath('/admin/articles')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get article by ID (for editing)
 */
export async function getArticleById(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select(`
        *,
        category:categories(id, name_bg, slug),
        author:users(id, full_name),
        featured_image:media(id, public_url, file_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Article not found')
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get article by slug (for public viewing)
 */
export async function getArticleBySlug(slug: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select(`
        *,
        category:categories(id, name_bg, slug),
        author:users(id, full_name),
        featured_image:media(id, public_url, file_name, alt_text)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Article not found')
    }

    // Increment view count
    await supabaseAdmin
      .from('articles')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id)

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get articles for admin list with filters
 */
export async function getArticles(filters?: {
  status?: string
  categoryId?: string
  search?: string
  limit?: number
  offset?: number
}) {
  try {
    let query = supabaseAdmin
      .from('articles')
      .select(`
        *,
        category:categories(id, name_bg),
        author:users(id, full_name)
      `, { count: 'exact' })

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`)
    }

    // Pagination
    const limit = filters?.limit || 20
    const offset = filters?.offset || 0
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch articles')
    }

    return {
      success: true,
      data,
      count: count || 0,
      hasMore: count ? offset + limit < count : false,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Publish article (change status from draft to published)
 */
export async function publishArticle(id: string, userId: string) {
  return updateArticle(
    { id, status: 'published' },
    userId
  )
}

/**
 * Unpublish article (change status from published to draft)
 */
export async function unpublishArticle(id: string, userId: string) {
  return updateArticle(
    { id, status: 'draft' },
    userId
  )
}

/**
 * Archive article
 */
export async function archiveArticle(id: string, userId: string) {
  return updateArticle(
    { id, status: 'archived' },
    userId
  )
}
