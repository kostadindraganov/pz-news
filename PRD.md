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
| **Next.js 15** | React framework with App Router | Latest |
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

## 6. Zod Validation Schemas

### 6.1 Article Schema

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

### 6.2 Category Schema

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

### 6.3 User Schema

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

## 7. Authentication with better-auth

### 7.1 Configuration

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

### 7.2 Middleware Protection

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

## 8. Image Upload to Cloudflare R2

### 8.1 R2 Client Setup

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

### 8.2 Upload API Route

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

## 9. oRPC Implementation

### 9.1 Article Router

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

## 10. User Stories

### 10.1 Public User Stories

1. **As a visitor**, I want to view the latest news articles on the homepage, so I can stay informed about local events.
2. **As a visitor**, I want to browse articles by category, so I can find news relevant to my interests.
3. **As a visitor**, I want to read full articles with images, so I can get detailed information.
4. **As a visitor**, I want to search for articles, so I can find specific news.
5. **As a visitor**, I want to view articles from my specific region, so I can stay updated on local matters.

### 10.2 Admin User Stories

1. **As an admin**, I want to create new articles with rich text content, so I can publish news.
2. **As an admin**, I want to upload images to accompany articles, so I can make content more engaging.
3. **As an admin**, I want to categorize articles, so visitors can easily find related content.
4. **As an admin**, I want to save articles as drafts, so I can work on them before publishing.
5. **As an admin**, I want to edit published articles, so I can correct errors or add updates.
6. **As an admin**, I want to manage categories, so I can organize the site structure.
7. **As an admin**, I want to manage users, so I can control who has access to the admin panel.
8. **As an admin**, I want to view article statistics, so I can understand reader engagement.

---

## 11. SEO Requirements

### 11.1 On-Page SEO

- Dynamic meta titles and descriptions for each article
- Open Graph tags for social sharing
- Twitter Card meta tags
- Canonical URLs
- Structured data (JSON-LD) for articles:
  - NewsArticle schema
  - Author schema
  - Organization schema

### 11.2 Technical SEO

- Sitemap generation (`/sitemap.xml`)
- Robots.txt configuration
- Semantic HTML structure
- Image alt text requirements
- Fast page load times (< 3s)
- Mobile-friendly responsive design
- HTTPS only

### 11.3 URL Structure

- Homepage: `/`
- Category: `/[category-slug]`
- Article: `/[category-slug]/[article-slug]`
- Search: `/search?q=query`
- Admin: `/admin/*`

---

## 12. Performance Requirements

### 12.1 Loading Performance

- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

### 12.2 Optimization Strategies

- **Next.js Image Optimization**: Use `next/image` for all images
- **Static Generation**: Pre-render category pages at build time
- **Incremental Static Regeneration (ISR)**: Revalidate article pages every 60 seconds
- **Code Splitting**: Automatic with Next.js App Router
- **Lazy Loading**: Images and below-the-fold content
- **CDN**: Cloudflare R2 for image delivery
- **Database Indexing**: Index frequently queried columns
- **Caching**: Implement caching strategies for API responses

---

## 13. Security Requirements

### 13.1 Authentication & Authorization

- Secure password hashing (handled by better-auth)
- Session-based authentication
- Role-based access control (RBAC)
- Admin-only routes protected by middleware
- First user automatically becomes admin

### 13.2 Data Protection

- SQL injection prevention (Supabase/Parameterized queries)
- XSS protection (React automatic escaping)
- CSRF protection
- Content Security Policy (CSP) headers
- HTTPS enforcement
- Secure cookie settings (httpOnly, secure, sameSite)

### 13.3 Input Validation

- Zod validation on all user inputs
- File upload validation:
  - Allowed file types: jpg, jpeg, png, webp
  - Max file size: 10MB
  - Image dimensions validation
- Rate limiting on API routes
- Sanitize user-generated content

### 13.4 Supabase Security

- Row Level Security (RLS) enabled on all tables
- Service role key kept server-side only
- Anonymous key for public read-only access
- Proper RLS policies for each table

---

## 14. Responsive Design Requirements

### 14.1 Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### 14.2 Mobile-First Design

- Touch-friendly interface (min 44x44px touch targets)
- Hamburger menu for mobile navigation
- Optimized images for mobile (smaller sizes)
- Readable font sizes (min 16px for body text)
- Adequate spacing and padding

---

## 15. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup with Next.js 15, TypeScript, Tailwind
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

## 16. Environment Variables

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

## 17. Testing Strategy

### 17.1 Unit Tests
- Validation schemas (Zod)
- Utility functions
- Service layer functions

### 17.2 Integration Tests
- API routes
- oRPC endpoints
- Database operations

### 17.3 E2E Tests
- User login flow
- Article creation flow
- Image upload flow
- Article publishing flow

---

## 18. Monitoring & Analytics

### 18.1 Performance Monitoring
- Vercel Analytics
- Web Vitals tracking
- Error tracking (Sentry)

### 18.2 User Analytics
- Google Analytics 4
- Page view tracking
- Article view tracking
- Search queries tracking

---

## 19. Future Enhancements (Post-MVP)

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

## 20. Success Metrics

### 20.1 Technical Metrics
- Page load time < 3 seconds
- Lighthouse score > 90
- Zero critical security vulnerabilities
- 99.9% uptime

### 20.2 Business Metrics
- Number of published articles per month
- User engagement (time on site, pages per session)
- Article view count
- Search usage
- Mobile vs desktop traffic ratio

---

## 21. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| R2 storage costs exceed budget | Medium | Low | Implement image optimization, set up alerts |
| Performance issues with large content | High | Medium | Implement pagination, lazy loading, ISR |
| Security vulnerabilities | High | Low | Regular security audits, keep dependencies updated |
| Database scaling issues | Medium | Low | Optimize queries, implement caching |
| User adoption of admin panel | Medium | Medium | Provide training, intuitive UI design |

---

## 22. Support & Maintenance

### 22.1 Documentation
- Technical documentation for developers
- User guide for admin panel
- API documentation (oRPC endpoints)

### 22.2 Ongoing Tasks
- Weekly database backups
- Monthly security updates
- Quarterly feature reviews
- Performance monitoring and optimization

---

## 23. Stakeholder Sign-off

- [ ] Technical Lead
- [ ] Project Manager
- [ ] Content Team Lead
- [ ] Client/Product Owner

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-12 | Claude | Initial PRD creation |

---

**End of Document**
