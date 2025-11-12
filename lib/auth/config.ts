import { betterAuth } from 'better-auth'
import { createClient } from '@supabase/supabase-js'

// Supabase adapter for better-auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const auth = betterAuth({
  database: {
    provider: 'postgres',
    url: process.env.DATABASE_URL || '',
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'],
})

export type Session = typeof auth.$Infer.Session
