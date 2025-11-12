/**
 * Database type definitions for Supabase
 *
 * To regenerate these types from your Supabase schema, run:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          full_name: string
          role: 'admin' | 'editor' | 'author'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          full_name: string
          role?: 'admin' | 'editor' | 'author'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          full_name?: string
          role?: 'admin' | 'editor' | 'author'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          slug: string
          name_bg: string
          name_en: string | null
          description: string | null
          parent_id: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name_bg: string
          name_en?: string | null
          description?: string | null
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name_bg?: string
          name_en?: string | null
          description?: string | null
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          slug: string
          title: string
          subtitle: string | null
          excerpt: string | null
          content: string
          featured_image_url: string | null
          featured_image_alt: string | null
          author_id: string
          category_id: string
          status: 'draft' | 'published' | 'archived'
          is_featured: boolean
          is_breaking: boolean
          view_count: number
          published_at: string | null
          created_at: string
          updated_at: string
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string[] | null
        }
        Insert: {
          id?: string
          slug: string
          title: string
          subtitle?: string | null
          excerpt?: string | null
          content: string
          featured_image_url?: string | null
          featured_image_alt?: string | null
          author_id: string
          category_id: string
          status?: 'draft' | 'published' | 'archived'
          is_featured?: boolean
          is_breaking?: boolean
          view_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          subtitle?: string | null
          excerpt?: string | null
          content?: string
          featured_image_url?: string | null
          featured_image_alt?: string | null
          author_id?: string
          category_id?: string
          status?: 'draft' | 'published' | 'archived'
          is_featured?: boolean
          is_breaking?: boolean
          view_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
        }
      }
      tags: {
        Row: {
          id: string
          slug: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          created_at?: string
        }
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
      }
      media: {
        Row: {
          id: string
          file_name: string
          original_name: string
          mime_type: string
          file_size: number
          width: number | null
          height: number | null
          r2_key: string
          r2_bucket: string
          public_url: string
          thumbnail_url: string | null
          medium_url: string | null
          uploaded_by: string | null
          alt_text: string | null
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          file_name: string
          original_name: string
          mime_type: string
          file_size: number
          width?: number | null
          height?: number | null
          r2_key: string
          r2_bucket: string
          public_url: string
          thumbnail_url?: string | null
          medium_url?: string | null
          uploaded_by?: string | null
          alt_text?: string | null
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          file_name?: string
          original_name?: string
          mime_type?: string
          file_size?: number
          width?: number | null
          height?: number | null
          r2_key?: string
          r2_bucket?: string
          public_url?: string
          thumbnail_url?: string | null
          medium_url?: string | null
          uploaded_by?: string | null
          alt_text?: string | null
          caption?: string | null
          created_at?: string
        }
      }
      tv_programs: {
        Row: {
          id: string
          title: string
          description: string | null
          video_url: string | null
          thumbnail_url: string | null
          duration: number | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
