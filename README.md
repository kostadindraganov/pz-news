# PZ-News - Regional News Platform

A modern, performant news website built with Next.js 16 for Pazardzhik and surrounding regions in Bulgaria.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (Canary) with App Router
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: better-auth
- **Storage**: Cloudflare R2 (S3-compatible)
- **Validation**: Zod
- **Image Processing**: Sharp
- **Form Management**: React Hook Form

## ✨ Features

### Public Website
- Homepage with featured/breaking news
- Article pages with rich content
- Category and tag navigation
- Search functionality
- Regional news sections
- TV programs section
- Responsive mobile-first design
- SEO optimized

### Admin Panel
- Article management (create, edit, publish)
- Rich text editor
- Media library with R2 uploads
- Category management
- User management (admin only)
- TV programs management
- Dashboard with statistics

## 📁 Project Structure

```
pz-news/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public-facing pages
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── components/             # React components
│   ├── ui/                # shadcn components
│   ├── admin/             # Admin components
│   └── public/            # Public components
├── lib/                    # Utilities & config
│   ├── supabase/          # Supabase client
│   ├── validations/       # Zod schemas
│   └── utils.ts           # Helper functions
├── server/                 # Server-side code
│   ├── routers/           # oRPC routers
│   └── services/          # Business logic
├── types/                  # TypeScript types
│   └── database.ts        # Supabase types
├── hooks/                  # Custom React hooks
└── public/                 # Static assets
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Cloudflare R2 account

### 1. Clone the repository

```bash
git clone <repository-url>
cd pz-news
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

Note: `--legacy-peer-deps` is needed due to React 19 compatibility with some packages.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# better-auth
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000

# Cloudflare R2
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=pz-news-images
R2_PUBLIC_URL=https://images.pz-news.com
```

### 4. Database setup

See [DATABASE_SETUP.md](./docs/DATABASE_SETUP.md) for detailed instructions on:
- Creating Supabase tables
- Setting up Row Level Security (RLS)
- Running seed scripts
- Generating TypeScript types

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📝 Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

## 🏗️ Implementation Status

### ✅ Phase 1: Foundation (Completed)
- [x] Next.js 16 project setup with Turbopack
- [x] TypeScript strict configuration
- [x] Tailwind CSS + shadcn/ui integration
- [x] Project structure (app, lib, components, types)
- [x] Supabase client setup (client + admin)
- [x] Zod validation schemas (article, category, user, media)
- [x] Utility functions (slug, date formatting, truncate)

### ✅ Phase 2: Database & Auth (Completed)
- [x] Complete PostgreSQL schema with 6+ tables
- [x] Row Level Security (RLS) policies
- [x] Database indexes for performance
- [x] better-auth configuration
- [x] Cloudflare R2 client setup
- [x] React Cache & unstable_cache for query optimization
- [x] Route protection middleware
- [x] shadcn/ui base components (Button, Card, Input, etc.)

### ✅ Phase 3: Public Website (Completed)
- [x] Public layout with Header & Footer
- [x] Homepage with ISR (30s revalidation) & Suspense streaming
- [x] Article detail pages with 60s ISR caching
- [x] Category pages with static generation (5min revalidation)
- [x] Article card & grid components
- [x] Breaking news, featured, trending sections
- [x] SEO metadata & OpenGraph tags
- [x] Sitemap generation
- [x] robots.txt configuration

### ⏳ Phase 4: Admin Panel (Pending)
- [ ] Admin layout & navigation
- [ ] Article management (CRUD)
- [ ] Rich text editor integration
- [ ] Media library with R2 uploads
- [ ] Category management
- [ ] User management

## 🎨 Design System

The project uses shadcn/ui components with a custom color scheme defined in `tailwind.config.ts`. Components are located in `components/ui/`.

## 🔒 Authentication

- Uses better-auth for secure authentication
- First user becomes admin automatically
- Role-based access control (admin, editor, author)
- Session-based authentication

## 📦 Database Schema

See [PRD.md](./PRD.md) for the complete database schema including:
- users
- categories
- articles
- tags
- article_tags
- media
- tv_programs

## 🚀 Performance Optimizations

Next.js 16 caching strategies implemented:
- **Request Memoization**: Automatic fetch deduplication
- **Data Cache**: Persistent server-side caching with ISR
- **Full Route Cache**: Static page generation
- **Router Cache**: Client-side navigation cache
- **Partial Prerendering (PPR)**: Mix static and dynamic content
- **React Cache**: Database query deduplication
- **On-Demand Revalidation**: Cache invalidation via tags/paths

## 📚 Documentation

- [Product Requirements Document](./PRD.md) - Complete PRD with specifications
- [Database Setup](./docs/DATABASE_SETUP.md) - Database schema and setup
- [API Documentation](./docs/API.md) - API endpoints and usage
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

ISC

## 📞 Support

For issues and questions, please open an issue in the repository.
