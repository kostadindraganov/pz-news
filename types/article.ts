// Temporary types until Supabase types are generated
export interface Article {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  excerpt?: string | null
  content: string
  category_id: string
  author_id: string
  status: string
  is_featured: boolean
  is_breaking: boolean
  featured_image_id?: string | null
  featured_image_url?: string | null
  featured_image_alt?: string | null
  view_count?: number | null
  meta_title?: string | null
  meta_description?: string | null
  meta_keywords?: string[] | null
  published_at?: string | null
  created_at: string
  updated_at: string
  author?: {
    id: string
    full_name: string
    email: string
    role: string
  }
  category?: {
    id: string
    name_bg: string
    name_en?: string | null
    slug: string
    description?: string | null
  }
  featured_image?: {
    id: string
    public_url: string
    file_name: string
    alt_text?: string | null
  }
}

export interface Category {
  id: string
  slug: string
  name_bg: string
  name_en?: string | null
  description?: string | null
  parent_id?: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  parent?: {
    id: string
    name_bg: string
    slug: string
  }
}
