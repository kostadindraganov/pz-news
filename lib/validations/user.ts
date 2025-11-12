import { z } from 'zod'

export const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2).max(255),
  role: z.enum(['admin', 'editor', 'author']).default('author'),
})

export type UserCreateInput = z.infer<typeof userCreateSchema>

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true })

export type UserUpdateInput = z.infer<typeof userUpdateSchema>

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type UserLoginInput = z.infer<typeof userLoginSchema>
