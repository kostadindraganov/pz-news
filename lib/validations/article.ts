import { z } from 'zod'

export const articleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(500),
  subtitle: z.string().max(500).optional(),
  excerpt: z.string().max(1000).optional(),
  content: z.string().min(50, 'Content must be at least 50 characters'),

  categoryId: z.string().uuid('Invalid category'),
  tags: z.array(z.string()).optional(),

  featuredImageUrl: z.string().url().optional(),
  featuredImageAlt: z.string().max(255).optional(),

  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  isFeatured: z.boolean().default(false),
  isBreaking: z.boolean().default(false),

  publishedAt: z.date().optional(),

  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  metaKeywords: z.array(z.string()).optional(),
})

export type ArticleInput = z.infer<typeof articleSchema>

export const createArticleSchema = articleSchema

export const updateArticleSchema = articleSchema.partial()
