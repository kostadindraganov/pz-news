# Database Setup Guide

This guide will help you set up the Supabase database for PZ-News.

## Prerequisites

- Supabase account (free tier is sufficient for development)
- Supabase project created

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Enter project details:
   - **Name**: pz-news
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your target audience
   - **Pricing Plan**: Free (for development)
5. Wait for project to be provisioned (2-3 minutes)

## Step 2: Run Database Migration

1. In your Supabase project dashboard, navigate to **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql` from this repository
3. Copy the entire content
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

This will create:
- All tables (users, articles, categories, tags, media, tv_programs)
- Indexes for performance
- Row Level Security (RLS) policies
- Updated_at triggers
- Default categories with regional subcategories

## Step 3: Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Find these values:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: This is your `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Step 4: Update Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 5: Verify Setup

Run this query in Supabase SQL Editor to verify:

```sql
-- Check that all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Check that categories were inserted
SELECT count(*) FROM categories;
-- Should return 21 (10 main categories + 11 regional subcategories)

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

## Database Schema Overview

### Tables

#### **users**
Stores user accounts with roles (admin, editor, author).

#### **categories**
Hierarchical categories with parent-child relationships.
- Main categories: Пазарджик, България, Общество, etc.
- Regional subcategories: Батак, Белово, Брацигово, etc.

#### **articles**
News articles with full content, metadata, and SEO fields.
- Supports drafts, published, and archived states
- Featured and breaking news flags
- View counter
- Rich metadata for SEO

#### **tags**
Tags for categorizing articles (many-to-many via article_tags).

#### **media**
Images stored in Cloudflare R2 with metadata.

#### **tv_programs**
TV show/program content with video URLs.

### Row Level Security (RLS)

All tables have RLS enabled with policies:

**Articles:**
- Public: Can view published articles
- Authors: Can create, view, update, delete own articles
- Admins: Full access

**Categories:**
- Public: Can view active categories
- Admins: Full management access

**Media:**
- Public: Can view all media
- Authenticated users: Can upload media
- Users: Can delete own uploads
- Admins: Full access

**Tags:**
- Public: Can view tags
- Authenticated: Can create tags

**TV Programs:**
- Public: Can view published programs
- Admins: Full management access

## Testing the Database

### Create a Test User

```sql
-- Insert a test admin user (password: testpassword123)
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'admin@pz-news.com',
  '$2a$10$...', -- Use bcrypt to hash 'testpassword123'
  'Admin User',
  'admin'
);
```

### Create a Test Article

```sql
-- Get category and user IDs
SELECT id FROM categories WHERE slug = 'pazardzhik';
SELECT id FROM users WHERE email = 'admin@pz-news.com';

-- Insert test article
INSERT INTO articles (
  slug,
  title,
  content,
  author_id,
  category_id,
  status,
  published_at
)
VALUES (
  'test-article',
  'Тестова статия',
  '<p>Това е тестова статия с пример съдържание.</p>',
  'USER_ID_HERE',
  'CATEGORY_ID_HERE',
  'published',
  NOW()
);
```

## Generating TypeScript Types

To regenerate TypeScript types from your Supabase schema:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

Replace `YOUR_PROJECT_ID` with your Supabase project ID (found in project settings).

## Troubleshooting

### RLS Preventing Access

If you can't query data from the client:
1. Check that the table has proper RLS policies
2. Verify you're using the correct Supabase client (anon vs service role)
3. For testing, you can temporarily disable RLS on a table:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

### Migration Errors

If the migration fails:
1. Check for syntax errors in the SQL
2. Ensure the uuid-ossp extension is available
3. Run each section separately to identify the issue

### Performance Issues

If queries are slow:
1. Check that indexes were created (see migration file)
2. Run `ANALYZE` on tables to update statistics:
   ```sql
   ANALYZE articles;
   ANALYZE categories;
   ```

## Next Steps

After setting up the database:
1. Configure better-auth for authentication
2. Set up Cloudflare R2 for image storage
3. Run the development server and test queries
4. Create your first admin user via the UI

## Support

For Supabase-specific issues, consult:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
