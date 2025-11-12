import { supabaseAdmin } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import { categorySchema } from '@/lib/validations/category'
import { revalidateTag, revalidatePath } from 'next/cache'
import { z } from 'zod'

export type CategoryCreateInput = z.infer<typeof categorySchema>

export type CategoryUpdateInput = Partial<CategoryCreateInput> & {
  id: string
}

/**
 * Get all categories with optional parent relationship
 */
export async function getCategories(includeInactive = false) {
  try {
    let query = supabaseAdmin
      .from('categories')
      .select('*, parent:categories(id, name_bg, slug)')
      .order('display_order', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch categories')
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*, parent:categories(id, name_bg, slug)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Category not found')
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*, parent:categories(id, name_bg, slug)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Category not found')
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Create a new category
 */
export async function createCategory(input: CategoryCreateInput) {
  try {
    // Validate input
    const validatedData = categorySchema.parse(input)

    // Generate slug from name if not provided
    const slug = validatedData.slug || generateSlug(validatedData.nameBg)

    // Check if slug already exists
    const { data: existingCategory } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCategory) {
      throw new Error('Category with this slug already exists')
    }

    // Create category
    const { data, error } = await supabaseAdmin
      .from('categories')
      // @ts-ignore - Supabase types need regeneration
      .insert({
        slug,
        name_bg: validatedData.nameBg,
        name_en: validatedData.nameEn,
        description: validatedData.description,
        parent_id: validatedData.parentId,
        display_order: validatedData.displayOrder || 0,
        is_active: validatedData.isActive !== undefined ? validatedData.isActive : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to create category')
    }

    // Revalidate caches
    // Note: revalidateTag requires different signature in Next.js 16 with cacheComponents
    // revalidateTag('categories')
    revalidatePath('/admin/categories')
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
 * Update an existing category
 */
export async function updateCategory(input: CategoryUpdateInput) {
  try {
    const { id, ...updateData } = input

    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingCategory) {
      throw new Error('Category not found')
    }

    // Build update object
    const updateObject: any = {
      updated_at: new Date().toISOString(),
    }

    if (updateData.nameBg) {
      updateObject.name_bg = updateData.nameBg
      // Regenerate slug if name changed
      updateObject.slug = generateSlug(updateData.nameBg)
    }
    if (updateData.nameEn !== undefined) updateObject.name_en = updateData.nameEn
    if (updateData.description !== undefined) updateObject.description = updateData.description
    if (updateData.parentId !== undefined) updateObject.parent_id = updateData.parentId
    if (updateData.displayOrder !== undefined) updateObject.display_order = updateData.displayOrder
    if (updateData.isActive !== undefined) updateObject.is_active = updateData.isActive

    // Update category
    const { data, error } = await supabaseAdmin
      .from('categories')
      // @ts-ignore - Supabase types need regeneration
      .update(updateObject)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to update category')
    }

    // Revalidate caches
    // Note: revalidateTag requires different signature in Next.js 16 with cacheComponents
    // revalidateTag('categories')
    // revalidateTag(`category-${existingCategory.slug}`)
    revalidatePath('/admin/categories')
    revalidatePath(`/${(existingCategory as any).slug}`)
    revalidatePath('/')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string) {
  try {
    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingCategory) {
      throw new Error('Category not found')
    }

    // Check if category has articles
    const { count } = await supabaseAdmin
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      throw new Error('Cannot delete category with articles. Please reassign or delete articles first.')
    }

    // Check if category has subcategories
    const { count: subCount } = await supabaseAdmin
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', id)

    if (subCount && subCount > 0) {
      throw new Error('Cannot delete category with subcategories. Please delete or reassign subcategories first.')
    }

    // Delete category
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to delete category')
    }

    // Revalidate caches
    // Note: revalidateTag requires different signature in Next.js 16 with cacheComponents
    // revalidateTag('categories')
    // revalidateTag(`category-${existingCategory.slug}`)
    revalidatePath('/admin/categories')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Toggle category active status
 */
export async function toggleCategoryStatus(id: string) {
  try {
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('is_active')
      .eq('id', id)
      .single()

    if (!category) {
      throw new Error('Category not found')
    }

    return updateCategory({
      id,
      isActive: !(category as any).is_active,
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Reorder categories
 */
export async function reorderCategories(categoryIds: string[]) {
  try {
    // Update display_order for each category
    const updates = categoryIds.map((id, index) =>
      supabaseAdmin
        .from('categories')
        // @ts-ignore - Supabase types need regeneration
        .update({ display_order: index })
        .eq('id', id)
    )

    await Promise.all(updates)

    // Revalidate caches
    // Note: revalidateTag requires different signature in Next.js 16 with cacheComponents
    // revalidateTag('categories')
    revalidatePath('/admin/categories')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
