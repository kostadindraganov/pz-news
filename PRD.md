# Product Requirements Document (PRD)
## Pazardzhik News Website - Next.js Implementation

---

## 1. Project Overview

### 1.1 Project Name
**PZ-News** - Regional News Platform for Pazardzhik and Surrounding Areas

### 1.2 Project Description
A modern, performant news website built with Next.js that replicates the structure and functionality of viamedia.bg, featuring a comprehensive admin panel for content management, image uploads, and user authentication.

### 1.3 Target Audience
- Local residents of Pazardzhik and surrounding regions
- Content administrators and journalists
- Regional authorities and businesses
- National news readers interested in regional content

### 1.4 Goals
- Provide fast, reliable news delivery to the Pazardzhik region
- Enable easy content management through an intuitive admin panel
- Ensure optimal SEO performance for news articles
- Support scalable image storage and delivery
- Maintain mobile-first responsive design

---

## 2. Technical Stack

### 2.1 Core Technologies

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Next.js 16** | React framework with App Router & Advanced Caching | Latest (RC/Canary) |
| **TypeScript** | Type-safe development | 5.x |
| **React 19** | UI library | Latest |
| **Supabase** | Database & backend services | Latest |
| **Cloudflare R2** | Object storage for images | Latest |

### 2.2 Key Packages

| Package | Purpose |
|---------|---------|
| **shadcn/ui** | UI component library |
| **Tailwind CSS** | Styling framework |
| **Zod** | Schema validation |
| **better-auth** | Authentication system |
| **oRPC** | Type-safe data fetching |
| **next-themes** | Dark/light mode support |
| **react-hook-form** | Form management |
| **uploadthing** or **@aws-sdk/client-s3** | R2 uploads |
| **date-fns** | Date formatting |
| **sharp** | Image optimization |

### 2.3 Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **TypeScript** - Type checking
- **Vitest** - Unit testing

---

## 3. Database Schema (Supabase/PostgreSQL)

### 3.1 Core Tables

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'author', -- 'admin', 'editor', 'author'
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- First user becomes admin (handled in application logic)
```

#### **categories**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_bg VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Categories:**
- Пазарджик (Pazardzhik)
- Региони (Regions) - Parent category
  - Батак, Белово, Брацигово, Велинград, Лесичово, Панагюрище, Пещера, Ракитово, Септември, Стрелча, Сърница
- България (Bulgaria)
- Общество (Society)
- Крими (Crime)
- Спорт (Sports)
- Бизнес (Business)
- Свободно време (Leisure)
- Предавания (TV Programs)
- Здраве (Health)

#### **articles**
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500),
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  featured_image_alt VARCHAR(255),

  author_id UUID REFERENCES users(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,

  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  is_featured BOOLEAN DEFAULT false,
  is_breaking BOOLEAN DEFAULT false,

  view_count INTEGER DEFAULT 0,

  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- SEO fields
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT[]
);

CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_slug ON articles(slug);
```

#### **article_tags**
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
```

#### **media**
```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,

  -- R2 storage info
  r2_key VARCHAR(500) NOT NULL,
  r2_bucket VARCHAR(100) NOT NULL,
  public_url TEXT NOT NULL,

  -- Thumbnails
  thumbnail_url TEXT,
  medium_url TEXT,

  uploaded_by UUID REFERENCES users(id),
  alt_text VARCHAR(255),
  caption TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
```

#### **tv_programs**
```sql
CREATE TABLE tv_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds

  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Public read access for published articles
CREATE POLICY "Public articles are viewable by everyone"
  ON articles FOR SELECT
  USING (status = 'published');

-- Authors can view their own drafts
CREATE POLICY "Authors can view own articles"
  ON articles FOR SELECT
  USING (auth.uid() = author_id);

-- Authors can create articles
CREATE POLICY "Authors can insert articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can update own articles
CREATE POLICY "Authors can update own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = author_id);

-- Admins can do everything
CREATE POLICY "Admins have full access"
  ON articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

---

## 4. Features & Functionality

### 4.1 Public-Facing Features

#### 4.1.1 Homepage
- **Hero Section**: Featured/breaking news articles with large images
- **Category Sections**: Latest articles from each main category
- **Regional News Grid**: Quick access to all regional subcategories
- **Trending Articles**: Most viewed articles widget
- **Latest News**: Chronological list of recent articles
- **TV Programs**: Featured TV show/program highlights

#### 4.1.2 Article Pages
- Full article content with rich text formatting
- Featured image with caption
- Author information and avatar
- Publication date and last updated time
- Category and tags
- Related articles section
- Social sharing buttons (Facebook, Twitter, LinkedIn)
- View counter
- Breadcrumb navigation
- SEO optimized meta tags

#### 4.1.3 Category Pages
- List of articles filtered by category
- Subcategory navigation (for Региони)
- Pagination or infinite scroll
- Filter by date range
- Sort options (newest, most viewed)

#### 4.1.4 Search Functionality
- Full-text search across articles
- Search by category
- Search by tags
- Search autocomplete

#### 4.1.5 Navigation
- Main navigation menu with all categories
- Sticky header on scroll
- Mobile hamburger menu
- Footer with categories, contact info, social links

### 4.2 Admin Panel Features

#### 4.2.1 Dashboard (`/admin`)
- **Overview Statistics**:
  - Total articles (published, draft, archived)
  - Total views this month
  - Recent activity feed
  - Quick actions (New Article, Manage Media)

#### 4.2.2 Article Management (`/admin/articles`)
- **List View**:
  - Table with columns: Title, Category, Status, Author, Published Date, Views
  - Filters: Status, Category, Author, Date range
  - Bulk actions: Delete, Change status
  - Search by title

- **Create/Edit Article** (`/admin/articles/new`, `/admin/articles/[id]/edit`):
  - Rich text editor (TipTap or similar)
  - Title input (auto-generate slug)
  - Subtitle input
  - Excerpt textarea
  - Category selector (dropdown)
  - Tag input (multi-select or create new)
  - Featured image upload with preview
  - Image alt text
  - Status selector (draft, published, archived)
  - Featured article checkbox
  - Breaking news checkbox
  - SEO fields section:
    - Meta title
    - Meta description
    - Meta keywords
  - Publish date/time picker
  - Save as draft button
  - Publish button
  - Preview button

#### 4.2.3 Media Library (`/admin/media`)
- Grid view of all uploaded images
- Upload new images (drag-and-drop or file picker)
- Bulk upload support
- Image details modal:
  - File name, size, dimensions
  - Upload date and uploader
  - Public URL
  - Alt text editor
  - Caption editor
- Delete images
- Search and filter
- Copy URL to clipboard

#### 4.2.4 Category Management (`/admin/categories`)
- List all categories
- Create new category
- Edit category (name, slug, description, parent)
- Reorder categories (drag-and-drop)
- Delete category (with warning about articles)
- Active/inactive toggle

#### 4.2.5 User Management (`/admin/users`) - Admin only
- List all users
- Create new user
- Edit user details
- Change user role (admin, editor, author)
- Activate/deactivate user
- View user's articles

#### 4.2.6 TV Programs Management (`/admin/tv-programs`)
- List all TV programs
- Create new program
- Edit program details
- Upload video or link external video
- Thumbnail upload
- Publish/unpublish

#### 4.2.7 Settings (`/admin/settings`)
- Site settings:
  - Site name
  - Site description
  - Contact email
  - Social media links
- SEO settings
- User profile management

### 4.3 Authentication Features

#### 4.3.1 Login (`/login`)
- Email and password login
- "Remember me" checkbox
- Password reset link
- Redirect to admin dashboard on success

#### 4.3.2 Password Reset
- Request reset email
- Token-based reset flow
- Set new password

#### 4.3.3 First User Registration
- Special flow for first user (becomes admin automatically)
- Subsequent users created by admin only

---

## 5. System Architecture

### 5.1 Next.js App Router Structure

```
/app
├── (public)                    # Public-facing pages
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Homepage
│   ├── [category]             # Category pages
│   │   ├── page.tsx
│   │   └── [slug]             # Article pages
│   │       └── page.tsx
│   ├── search
│   │   └── page.tsx
│   └── tv-programs
│       └── page.tsx
│
├── admin                       # Admin panel
│   ├── layout.tsx             # Admin layout with sidebar
│   ├── page.tsx               # Dashboard
│   ├── articles
│   │   ├── page.tsx           # Articles list
│   │   ├── new
│   │   │   └── page.tsx       # New article
│   │   └── [id]
│   │       └── edit
│   │           └── page.tsx   # Edit article
│   ├── media
│   │   └── page.tsx           # Media library
│   ├── categories
│   │   └── page.tsx
│   ├── users
│   │   └── page.tsx
│   ├── tv-programs
│   │   └── page.tsx
│   └── settings
│       └── page.tsx
│
├── login
│   └── page.tsx
├── api                         # API routes
│   ├── auth
│   │   └── [...auth].ts       # better-auth endpoints
│   ├── upload                  # Image upload to R2
│   │   └── route.ts
│   └── orpc
│       └── [...orpc].ts       # oRPC endpoints
│
└── globals.css
```

### 5.2 Project Structure

```
/pz-news
├── /app                        # Next.js App Router
├── /components                 # React components
│   ├── /ui                    # shadcn components
│   ├── /admin                 # Admin-specific components
│   ├── /public                # Public-facing components
│   ├── article-card.tsx
│   ├── article-content.tsx
│   ├── navigation.tsx
│   ├── footer.tsx
│   └── ...
├── /lib                        # Utilities and configurations
│   ├── /supabase              # Supabase client
│   ├── /auth                  # better-auth config
│   ├── /r2                    # Cloudflare R2 client
│   ├── /orpc                  # oRPC setup
│   ├── /validations           # Zod schemas
│   ├── utils.ts
│   └── constants.ts
├── /server                     # Server-side code
│   ├── /routers               # oRPC routers
│   │   ├── articles.ts
│   │   ├── categories.ts
│   │   ├── media.ts
│   │   └── users.ts
│   └── /services              # Business logic
│       ├── article-service.ts
│       ├── media-service.ts
│       └── ...
├── /types                      # TypeScript types
│   ├── database.ts
│   ├── article.ts
│   └── ...
├── /hooks                      # Custom React hooks
│   ├── use-user.ts
│   ├── use-articles.ts
│   └── ...
├── /public                     # Static assets
│   └── /images
├── .env.local                  # Environment variables
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 5.3 Data Flow

1. **Public Pages**:
   - Server Component → oRPC → Supabase → Data
   - Images served from Cloudflare R2 via public URLs
   - Static generation for category pages
   - Dynamic rendering for article pages with ISR

2. **Admin Pages**:
   - Client Component → oRPC → Server Action → Supabase
   - Image uploads → API Route → Cloudflare R2
   - Client-side state management for forms

---

## 6. Next.js 16 Caching & Performance Strategies

### 6.1 Next.js 16 Caching Layers

Next.js 16 provides four primary caching mechanisms that we'll leverage:

#### 6.1.1 Request Memoization (Automatic)
- **What**: Deduplicates identical fetch requests during a single render pass
- **Scope**: Single server request lifecycle
- **Implementation**: Automatic (no configuration needed)
- **Use Case**: Multiple components fetching the same data

```typescript
// Multiple calls to this function in the same render tree will only execute once
async function getArticle(id: string) {
  const res = await fetch(`${API_URL}/articles/${id}`)
  return res.json()
}
```

#### 6.1.2 Data Cache (Persistent, Server-Side)
- **What**: Caches fetch responses across requests and deployments
- **Duration**: Persistent until revalidation or redeploy
- **Configuration**: Per-request or route-level

**Implementation Strategies:**

```typescript
// app/[category]/[slug]/page.tsx - Article Page
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  // Cache article data for 60 seconds, then revalidate in background
  const article = await fetch(`${API_URL}/articles/${params.slug}`, {
    next: { revalidate: 60 } // ISR: 60 second stale-while-revalidate
  }).then(res => res.json())

  return <ArticleContent article={article} />
}

// app/[category]/page.tsx - Category Page
export default async function CategoryPage({ params }: { params: { category: string } }) {
  // Cache category articles for 5 minutes
  const articles = await fetch(`${API_URL}/articles?category=${params.category}`, {
    next: {
      revalidate: 300, // 5 minutes
      tags: ['articles', `category-${params.category}`]
    }
  }).then(res => res.json())

  return <ArticleGrid articles={articles} />
}

// app/page.tsx - Homepage
export default async function HomePage() {
  // Cache homepage data for 30 seconds
  const [featured, latest, trending] = await Promise.all([
    fetch(`${API_URL}/articles/featured`, {
      next: { revalidate: 30, tags: ['featured-articles'] }
    }).then(res => res.json()),

    fetch(`${API_URL}/articles/latest`, {
      next: { revalidate: 30, tags: ['latest-articles'] }
    }).then(res => res.json()),

    fetch(`${API_URL}/articles/trending`, {
      next: { revalidate: 120, tags: ['trending-articles'] } // 2 minutes
    }).then(res => res.json())
  ])

  return <Homepage featured={featured} latest={latest} trending={trending} />
}
```

**On-Demand Revalidation:**

```typescript
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { tags, paths } = await request.json()

  // Revalidate by tag
  if (tags) {
    for (const tag of tags) {
      revalidateTag(tag)
    }
  }

  // Revalidate by path
  if (paths) {
    for (const path of paths) {
      revalidatePath(path)
    }
  }

  return NextResponse.json({ revalidated: true, now: Date.now() })
}

// server/services/article-service.ts
export async function publishArticle(articleId: string) {
  // Publish the article in database
  await supabase
    .from('articles')
    .update({ status: 'published', published_at: new Date() })
    .eq('id', articleId)

  // Revalidate relevant caches
  await fetch('/api/revalidate', {
    method: 'POST',
    body: JSON.stringify({
      tags: ['articles', 'featured-articles', 'latest-articles'],
      paths: ['/', '/pazardzhik']
    })
  })
}
```

#### 6.1.3 Full Route Cache (Static Optimization)
- **What**: Caches the entire rendered route (HTML + RSC payload)
- **When**: Static routes at build time, dynamic routes after first request
- **Control**: Via route segment config

```typescript
// app/[category]/page.tsx
export const dynamic = 'force-static' // Default: 'auto'
export const revalidate = 3600 // 1 hour ISR

// Pre-render all category pages at build time
export async function generateStaticParams() {
  const categories = await fetch(`${API_URL}/categories`).then(res => res.json())

  return categories.map((category: any) => ({
    category: category.slug
  }))
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  // This page will be statically generated at build time
  const articles = await getArticlesByCategory(params.category)
  return <ArticleGrid articles={articles} />
}
```

#### 6.1.4 Router Cache (Client-Side)
- **What**: In-memory client cache for visited routes
- **Duration**: Session-based or time-based
- **Configuration**: Automatic, but can be bypassed

```typescript
// Force refresh on navigation (bypass router cache)
import { useRouter } from 'next/navigation'

export function RefreshButton() {
  const router = useRouter()

  return (
    <button onClick={() => router.refresh()}>
      Refresh
    </button>
  )
}
```

### 6.2 Caching Strategy by Route Type

| Route | Rendering Strategy | Cache Duration | Revalidation Strategy |
|-------|-------------------|----------------|----------------------|
| **Homepage (/)** | ISR | 30 seconds | Time-based + On-demand |
| **Article Page** | ISR | 60 seconds | Time-based + On-demand on publish/edit |
| **Category Page** | Static + ISR | 5 minutes | Time-based + On-demand |
| **Search Results** | Dynamic | No cache | N/A |
| **Admin Pages** | Dynamic | No cache | N/A |
| **API Routes** | Dynamic | Custom | Per endpoint |

### 6.3 Partial Prerendering (PPR) - Experimental

Next.js 16 introduces Partial Prerendering, combining static and dynamic content:

```typescript
// next.config.js
module.exports = {
  experimental: {
    ppr: true, // Enable Partial Prerendering
  },
}

// app/[category]/[slug]/page.tsx
import { Suspense } from 'react'

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  // Static shell (cached)
  const article = await getArticle(params.slug)

  return (
    <article>
      <h1>{article.title}</h1>
      <div>{article.content}</div>

      {/* Dynamic content (not cached) */}
      <Suspense fallback={<div>Loading comments...</div>}>
        <Comments articleId={article.id} />
      </Suspense>

      {/* Dynamic view counter */}
      <Suspense fallback={<div>Views: ...</div>}>
        <ViewCounter articleId={article.id} />
      </Suspense>
    </article>
  )
}
```

### 6.4 Database Query Caching with React Cache

```typescript
// lib/cache.ts
import { cache } from 'react'
import { supabase } from '@/lib/supabase/client'

// Deduplicate database queries within a single request
export const getArticleById = cache(async (id: string) => {
  const { data, error } = await supabase
    .from('articles')
    .select('*, author:users(*), category:categories(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
})

export const getCategoryBySlug = cache(async (slug: string) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
})

// These functions will only execute once per request, even if called multiple times
```

### 6.5 Unstable_cache for Advanced Caching

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache'
import { supabase } from '@/lib/supabase/client'

// Cache expensive database queries with custom TTL
export const getTrendingArticles = unstable_cache(
  async (limit: number = 10) => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(limit)

    return data
  },
  ['trending-articles'], // Cache key
  {
    revalidate: 120, // 2 minutes
    tags: ['trending-articles'] // For on-demand revalidation
  }
)

export const getCategoryArticleCount = unstable_cache(
  async (categoryId: string) => {
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('status', 'published')

    return count
  },
  ['category-article-count'], // Base cache key
  {
    revalidate: 3600, // 1 hour
    tags: ['articles', 'categories']
  }
)
```

### 6.6 Image Optimization with Next.js 16

```typescript
// components/optimized-image.tsx
import Image from 'next/image'

export function OptimizedArticleImage({
  src,
  alt,
  priority = false
}: {
  src: string
  alt: string
  priority?: boolean
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      quality={85}
      priority={priority} // For above-the-fold images
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generate with sharp
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      loading={priority ? 'eager' : 'lazy'}
    />
  )
}
```

### 6.7 Route Segment Config for Performance

```typescript
// app/[category]/[slug]/page.tsx
// Static optimization configuration
export const dynamic = 'auto' // 'auto' | 'force-dynamic' | 'force-static'
export const revalidate = 60 // Revalidate every 60 seconds
export const fetchCache = 'default-cache' // 'auto' | 'default-cache' | 'only-cache' | 'force-cache'
export const dynamicParams = true // Allow dynamic params not generated by generateStaticParams
export const runtime = 'nodejs' // 'nodejs' | 'edge'

// Admin pages - Always dynamic
// app/admin/layout.tsx
export const dynamic = 'force-dynamic' // Never cache admin pages
export const revalidate = 0 // Disable caching
```

### 6.8 Streaming with Suspense Boundaries

```typescript
// app/page.tsx - Homepage with Streaming
import { Suspense } from 'react'

export default function HomePage() {
  return (
    <div>
      {/* Static hero - renders immediately */}
      <Hero />

      {/* Stream in featured articles */}
      <Suspense fallback={<ArticleGridSkeleton />}>
        <FeaturedArticles />
      </Suspense>

      {/* Stream in latest articles */}
      <Suspense fallback={<ArticleGridSkeleton />}>
        <LatestArticles />
      </Suspense>

      {/* Stream in regional news */}
      <Suspense fallback={<RegionalNewsSkeleton />}>
        <RegionalNews />
      </Suspense>
    </div>
  )
}

// Each component fetches its own data
async function FeaturedArticles() {
  const articles = await getFeaturedArticles()
  return <ArticleGrid articles={articles} />
}

async function LatestArticles() {
  const articles = await getLatestArticles()
  return <ArticleGrid articles={articles} />
}
```

### 6.9 CDN Caching Headers

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' }
        ]
      },
      {
        source: '/_next/image/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
      {
        source: '/:category/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' }
        ]
      }
    ]
  }
}
```

### 6.10 oRPC with Caching

```typescript
// server/routers/articles.ts with caching
import { unstable_cache } from 'next/cache'

export const articlesRouter = createRouter({
  getArticles: {
    input: z.object({
      categoryId: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(10),
    }),
    async resolve({ input }) {
      // Wrap database query in cache
      return unstable_cache(
        async () => {
          const { data } = await supabase
            .from('articles')
            .select('*')
            .eq('category_id', input.categoryId)
            .limit(input.limit)

          return data
        },
        [`articles-${input.categoryId}-${input.limit}`],
        {
          revalidate: 60,
          tags: ['articles', `category-${input.categoryId}`]
        }
      )()
    }
  }
})
```

---

## 7. Zod Validation Schemas

### 7.1 Article Schema

```typescript
import { z } from 'zod';

export const articleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(500),
  subtitle: z.string().max(500).optional(),
  excerpt: z.string().max(1000).optional(),
  content: z.string().min(50, 'Content must be at least 50 characters'),

  categoryId: z.string().uuid('Invalid category'),
  tags: z.array(z.string()).optional(),

  featuredImageUrl: z.string().url().optional(),
  featuredImageAlt: z.string().max(255).optional(),

  status: z.enum(['draft', 'published', 'archived']),
  isFeatured: z.boolean().default(false),
  isBreaking: z.boolean().default(false),

  publishedAt: z.date().optional(),

  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  metaKeywords: z.array(z.string()).optional(),
});

export type ArticleInput = z.infer<typeof articleSchema>;
```

### 7.2 Category Schema

```typescript
export const categorySchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  nameBg: z.string().min(2).max(255),
  nameEn: z.string().max(255).optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
```

### 7.3 User Schema

```typescript
export const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2).max(255),
  role: z.enum(['admin', 'editor', 'author']).default('author'),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });
```

---

## 8. Authentication with better-auth

### 8.1 Configuration

```typescript
// lib/auth/config.ts
import { betterAuth } from "better-auth";
import { supabaseAdapter } from "better-auth/adapters/supabase";

export const auth = betterAuth({
  database: supabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can be enabled later
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

### 8.2 Middleware Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

---

## 9. Image Upload to Cloudflare R2

### 9.1 R2 Client Setup

```typescript
// lib/r2/client.ts
import { S3Client } from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

### 9.2 Upload API Route

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/lib/r2/client';
import { auth } from '@/lib/auth/config';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  // Verify authentication
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Process image with sharp (resize, optimize)
  const buffer = await file.arrayBuffer();
  const optimized = await sharp(Buffer.from(buffer))
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Upload to R2
  const key = `images/${Date.now()}-${file.name}`;
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: optimized,
      ContentType: file.type,
    })
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  // Save to Supabase media table
  // ... (implementation)

  return NextResponse.json({ url: publicUrl });
}
```

---

## 10. oRPC Implementation

### 10.1 Article Router

```typescript
// server/routers/articles.ts
import { z } from 'zod';
import { createRouter } from '@/lib/orpc';
import { articleSchema } from '@/lib/validations/article';
import { supabase } from '@/lib/supabase/client';

export const articlesRouter = createRouter({
  getArticles: {
    input: z.object({
      categoryId: z.string().uuid().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }),
    output: z.object({
      articles: z.array(z.any()),
      total: z.number(),
    }),
    async resolve({ input }) {
      const { data, error, count } = await supabase
        .from('articles')
        .select('*, author:users(*), category:categories(*)', { count: 'exact' })
        .match(input.categoryId ? { category_id: input.categoryId } : {})
        .match(input.status ? { status: input.status } : {})
        .order('published_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) throw error;

      return { articles: data, total: count || 0 };
    },
  },

  createArticle: {
    input: articleSchema,
    output: z.object({ id: z.string().uuid() }),
    async resolve({ input, ctx }) {
      // ctx contains authenticated user
      const { data, error } = await supabase
        .from('articles')
        .insert({
          ...input,
          author_id: ctx.user.id,
          slug: generateSlug(input.title),
        })
        .select()
        .single();

      if (error) throw error;

      return { id: data.id };
    },
  },

  // ... more endpoints
});
```

---

## 11. User Stories

### 11.1 Public User Stories

1. **As a visitor**, I want to view the latest news articles on the homepage, so I can stay informed about local events.
2. **As a visitor**, I want to browse articles by category, so I can find news relevant to my interests.
3. **As a visitor**, I want to read full articles with images, so I can get detailed information.
4. **As a visitor**, I want to search for articles, so I can find specific news.
5. **As a visitor**, I want to view articles from my specific region, so I can stay updated on local matters.

### 11.2 Admin User Stories

1. **As an admin**, I want to create new articles with rich text content, so I can publish news.
2. **As an admin**, I want to upload images to accompany articles, so I can make content more engaging.
3. **As an admin**, I want to categorize articles, so visitors can easily find related content.
4. **As an admin**, I want to save articles as drafts, so I can work on them before publishing.
5. **As an admin**, I want to edit published articles, so I can correct errors or add updates.
6. **As an admin**, I want to manage categories, so I can organize the site structure.
7. **As an admin**, I want to manage users, so I can control who has access to the admin panel.
8. **As an admin**, I want to view article statistics, so I can understand reader engagement.

---

## 12. SEO Requirements

### 12.1 On-Page SEO

- Dynamic meta titles and descriptions for each article
- Open Graph tags for social sharing
- Twitter Card meta tags
- Canonical URLs
- Structured data (JSON-LD) for articles:
  - NewsArticle schema
  - Author schema
  - Organization schema

### 12.2 Technical SEO

- Sitemap generation (`/sitemap.xml`)
- Robots.txt configuration
- Semantic HTML structure
- Image alt text requirements
- Fast page load times (< 3s)
- Mobile-friendly responsive design
- HTTPS only

### 12.3 URL Structure

- Homepage: `/`
- Category: `/[category-slug]`
- Article: `/[category-slug]/[article-slug]`
- Search: `/search?q=query`
- Admin: `/admin/*`

---

## 13. Performance Requirements

### 13.1 Loading Performance

- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

### 13.2 Next.js 16 Performance Optimization Strategies

#### Core Optimizations
- **Next.js Image Optimization**: Use `next/image` for all images with automatic WebP/AVIF conversion
- **Static Generation**: Pre-render category pages at build time using `generateStaticParams`
- **Incremental Static Regeneration (ISR)**: Revalidate article pages every 60 seconds
- **Code Splitting**: Automatic with Next.js App Router
- **Lazy Loading**: Images and below-the-fold content with `loading="lazy"`
- **CDN**: Cloudflare R2 for image delivery with immutable caching
- **Database Indexing**: Index frequently queried columns (category_id, published_at, slug)

#### Next.js 16 Specific Optimizations
- **Partial Prerendering (PPR)**: Mix static shell with dynamic content using Suspense
- **React Cache**: Deduplicate database queries within a single request
- **unstable_cache**: Cache expensive operations across requests
- **Streaming with Suspense**: Progressive rendering for faster TTFB
- **Route Segment Config**: Fine-grained control over caching behavior per route
- **Request Memoization**: Automatic deduplication of fetch requests
- **Full Route Cache**: Cache entire rendered routes (HTML + RSC payload)
- **On-Demand Revalidation**: Instant cache updates via `revalidateTag`/`revalidatePath`

#### Advanced Techniques
- **Server Components by Default**: Reduce JavaScript bundle size
- **Client Components Only When Needed**: Use `'use client'` sparingly for interactivity
- **Font Optimization**: Use `next/font` for automatic font optimization and zero layout shift
- **Script Optimization**: Use `next/script` with appropriate loading strategies
- **Bundle Analysis**: Regular analysis with `@next/bundle-analyzer`
- **Tree Shaking**: Ensure all imports are tree-shakeable
- **Dynamic Imports**: Code-split heavy components with `next/dynamic`
- **Prefetching**: Automatic link prefetching for faster navigation
- **Compression**: Enable gzip/brotli compression at CDN level
- **HTTP/2 Server Push**: Enable at deployment platform (Vercel)
- **Edge Runtime**: Use Edge Runtime for API routes when possible for lower latency

---

## 14. Security Requirements

### 14.1 Authentication & Authorization

- Secure password hashing (handled by better-auth)
- Session-based authentication
- Role-based access control (RBAC)
- Admin-only routes protected by middleware
- First user automatically becomes admin

### 14.2 Data Protection

- SQL injection prevention (Supabase/Parameterized queries)
- XSS protection (React automatic escaping)
- CSRF protection
- Content Security Policy (CSP) headers
- HTTPS enforcement
- Secure cookie settings (httpOnly, secure, sameSite)

### 14.3 Input Validation

- Zod validation on all user inputs
- File upload validation:
  - Allowed file types: jpg, jpeg, png, webp
  - Max file size: 10MB
  - Image dimensions validation
- Rate limiting on API routes
- Sanitize user-generated content

### 14.4 Supabase Security

- Row Level Security (RLS) enabled on all tables
- Service role key kept server-side only
- Anonymous key for public read-only access
- Proper RLS policies for each table

---

## 15. Responsive Design Requirements

### 15.1 Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### 15.2 Mobile-First Design

- Touch-friendly interface (min 44x44px touch targets)
- Hamburger menu for mobile navigation
- Optimized images for mobile (smaller sizes)
- Readable font sizes (min 16px for body text)
- Adequate spacing and padding

---

## 16. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup with Next.js 16, TypeScript, Tailwind
- [ ] Install and configure all dependencies
- [ ] Supabase project setup
- [ ] Database schema creation
- [ ] better-auth configuration
- [ ] Cloudflare R2 setup
- [ ] oRPC setup
- [ ] Basic layout components (header, footer)
- [ ] Seed database with categories

### Phase 2: Public Website (Week 2-3)
- [ ] Homepage design and implementation
- [ ] Article page template
- [ ] Category page template
- [ ] Navigation component
- [ ] Article card component
- [ ] Search functionality
- [ ] SEO setup (meta tags, sitemap)
- [ ] Responsive design implementation

### Phase 3: Authentication (Week 3)
- [ ] Login page
- [ ] Registration flow (first user becomes admin)
- [ ] Password reset flow
- [ ] Session management
- [ ] Middleware for route protection

### Phase 4: Admin Panel - Core (Week 4-5)
- [ ] Admin layout with sidebar navigation
- [ ] Dashboard with statistics
- [ ] Article list page
- [ ] Create article page with rich text editor
- [ ] Edit article page
- [ ] Article status management (draft, publish, archive)
- [ ] Category selection
- [ ] Tag management

### Phase 5: Media Management (Week 5)
- [ ] Image upload to Cloudflare R2
- [ ] Media library UI
- [ ] Image optimization with sharp
- [ ] Thumbnail generation
- [ ] Media browser/picker for articles
- [ ] Delete media functionality

### Phase 6: Admin Panel - Advanced (Week 6)
- [ ] Category management (CRUD)
- [ ] User management (CRUD)
- [ ] TV programs management
- [ ] Settings page
- [ ] Bulk operations on articles

### Phase 7: Polish & Testing (Week 7)
- [ ] Performance optimization
- [ ] SEO audit and improvements
- [ ] Security audit
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Bug fixes
- [ ] Documentation

### Phase 8: Deployment (Week 8)
- [ ] Production environment setup
- [ ] Environment variables configuration
- [ ] Database migration to production
- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domain
- [ ] Setup monitoring and analytics
- [ ] Final testing on production

---

## 17. Environment Variables

```bash
# .env.local

# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# better-auth
BETTER_AUTH_SECRET=xxx # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# Cloudflare R2
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=pz-news-images
R2_PUBLIC_URL=https://images.pz-news.com

# oRPC (optional)
ORPC_ENDPOINT=/api/orpc
```

---

## 18. Testing Strategy

### 18.1 Unit Tests
- Validation schemas (Zod)
- Utility functions
- Service layer functions

### 18.2 Integration Tests
- API routes
- oRPC endpoints
- Database operations

### 18.3 E2E Tests
- User login flow
- Article creation flow
- Image upload flow
- Article publishing flow

---

## 19. Monitoring & Analytics

### 19.1 Performance Monitoring
- Vercel Analytics
- Web Vitals tracking
- Error tracking (Sentry)

### 19.2 User Analytics
- Google Analytics 4
- Page view tracking
- Article view tracking
- Search queries tracking

---

## 20. Future Enhancements (Post-MVP)

- [ ] Email notifications for new articles (newsletter)
- [ ] Comment system for articles
- [ ] Article versioning/history
- [ ] Advanced search with filters
- [ ] RSS feed generation
- [ ] Multi-language support (Bulgarian/English)
- [ ] Dark mode
- [ ] Progressive Web App (PWA)
- [ ] Push notifications
- [ ] Advanced analytics dashboard
- [ ] Article scheduling (publish at specific time)
- [ ] AI-powered content suggestions
- [ ] Automated image optimization and WebP conversion
- [ ] Video uploads and embedding
- [ ] Podcast integration

---

## 21. Success Metrics

### 21.1 Technical Metrics
- Page load time < 3 seconds
- Lighthouse score > 90
- Zero critical security vulnerabilities
- 99.9% uptime

### 21.2 Business Metrics
- Number of published articles per month
- User engagement (time on site, pages per session)
- Article view count
- Search usage
- Mobile vs desktop traffic ratio

---

## 22. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| R2 storage costs exceed budget | Medium | Low | Implement image optimization, set up alerts |
| Performance issues with large content | High | Medium | Implement pagination, lazy loading, ISR |
| Security vulnerabilities | High | Low | Regular security audits, keep dependencies updated |
| Database scaling issues | Medium | Low | Optimize queries, implement caching |
| User adoption of admin panel | Medium | Medium | Provide training, intuitive UI design |

---

## 23. Support & Maintenance

### 23.1 Documentation
- Technical documentation for developers
- User guide for admin panel
- API documentation (oRPC endpoints)

### 23.2 Ongoing Tasks
- Weekly database backups
- Monthly security updates
- Quarterly feature reviews
- Performance monitoring and optimization

---

## 24. Stakeholder Sign-off

- [ ] Technical Lead
- [ ] Project Manager
- [ ] Content Team Lead
- [ ] Client/Product Owner

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-12 | Claude | Initial PRD creation |
| 1.1 | 2025-11-12 | Claude | Updated to Next.js 16 with comprehensive caching & performance strategies |

---

**End of Document**
