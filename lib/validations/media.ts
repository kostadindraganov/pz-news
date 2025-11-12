import { z } from 'zod'

export const mediaUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  altText: z.string().max(255).optional(),
  caption: z.string().optional(),
})

export type MediaUploadInput = z.infer<typeof mediaUploadSchema>

// Validation for accepted file types
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, 'Max file size is 10MB')
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    'Only .jpg, .jpeg, .png and .webp formats are supported'
  )
