import { supabaseAdmin } from '@/lib/supabase/client'
import { r2Client } from '@/lib/storage/r2-client'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { revalidateTag, revalidatePath } from 'next/cache'

/**
 * Get all media files
 */
export async function getMediaFiles(filters?: {
  uploadedBy?: string
  limit?: number
  offset?: number
}) {
  try {
    let query = supabaseAdmin
      .from('media')
      .select(`
        *,
        uploader:users(id, full_name)
      `, { count: 'exact' })

    // Apply filters
    if (filters?.uploadedBy) {
      query = query.eq('uploaded_by', filters.uploadedBy)
    }

    // Pagination
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch media files')
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
 * Get media file by ID
 */
export async function getMediaById(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('media')
      .select(`
        *,
        uploader:users(id, full_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Media file not found')
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update media metadata
 */
export async function updateMedia(id: string, input: {
  altText?: string
  caption?: string
  title?: string
}) {
  try {
    // Check if media exists
    const { data: existingMedia, error: fetchError } = await supabaseAdmin
      .from('media')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingMedia) {
      throw new Error('Media file not found')
    }

    // Build update object
    const updateObject: any = {
      updated_at: new Date().toISOString(),
    }

    if (input.altText !== undefined) updateObject.alt_text = input.altText
    if (input.caption !== undefined) updateObject.caption = input.caption
    if (input.title !== undefined) updateObject.title = input.title

    // Update media
    const { data, error } = await supabaseAdmin
      .from('media')
      .update(updateObject)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to update media')
    }

    // Revalidate caches
    revalidateTag('media')
    revalidatePath('/admin/media')

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete a media file
 */
export async function deleteMedia(id: string, userId: string) {
  try {
    // Check if media exists
    const { data: existingMedia, error: fetchError } = await supabaseAdmin
      .from('media')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingMedia) {
      throw new Error('Media file not found')
    }

    // Check permissions (only uploader or admin can delete)
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    const isAdmin = currentUser?.role === 'admin'
    const isOwner = existingMedia.uploaded_by === userId

    if (!isAdmin && !isOwner) {
      throw new Error('Permission denied')
    }

    // Check if media is being used by any articles
    const { count } = await supabaseAdmin
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('featured_image_id', id)

    if (count && count > 0) {
      throw new Error('Cannot delete media that is being used by articles')
    }

    // Delete from R2
    try {
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: existingMedia.file_path,
        })
      )
    } catch (r2Error) {
      console.error('R2 deletion error:', r2Error)
      // Continue with database deletion even if R2 deletion fails
    }

    // Delete from database
    const { error } = await supabaseAdmin
      .from('media')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to delete media')
    }

    // Revalidate caches
    revalidateTag('media')
    revalidatePath('/admin/media')

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get media usage statistics
 */
export async function getMediaStats(userId?: string) {
  try {
    let query = supabaseAdmin
      .from('media')
      .select('file_size', { count: 'exact' })

    if (userId) {
      query = query.eq('uploaded_by', userId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch media stats')
    }

    // Calculate total storage used
    const totalSize = data?.reduce((acc, item) => acc + (item.file_size || 0), 0) || 0

    return {
      success: true,
      stats: {
        totalFiles: count || 0,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      },
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Search media files
 */
export async function searchMedia(searchTerm: string, limit = 20) {
  try {
    const { data, error } = await supabaseAdmin
      .from('media')
      .select(`
        *,
        uploader:users(id, full_name)
      `)
      .or(`file_name.ilike.%${searchTerm}%,alt_text.ilike.%${searchTerm}%,caption.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to search media')
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
