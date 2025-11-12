import { z } from 'zod'

export const categorySchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and dashes'),
  nameBg: z.string().min(2).max(255, 'Name must be between 2 and 255 characters'),
  nameEn: z.string().max(255).optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export type CategoryInput = z.infer<typeof categorySchema>

export const createCategorySchema = categorySchema

export const updateCategorySchema = categorySchema.partial()
