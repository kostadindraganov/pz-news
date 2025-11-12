-- PZ-News Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'author' CHECK (role IN ('admin', 'editor', 'author')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_bg VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500),
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  featured_image_alt VARCHAR(255),

  author_id UUID REFERENCES users(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,

  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
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

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article tags junction table
CREATE TABLE article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Media table
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- TV Programs table
CREATE TABLE tv_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds

  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_featured ON articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_articles_breaking ON articles(is_breaking) WHERE is_breaking = true;
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_tags_slug ON tags(slug);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tv_programs_updated_at BEFORE UPDATE ON tv_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for articles
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

-- Authors can delete own articles
CREATE POLICY "Authors can delete own articles"
  ON articles FOR DELETE
  USING (auth.uid() = author_id);

-- Admins have full access to articles
CREATE POLICY "Admins have full access to articles"
  ON articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for categories
-- Everyone can read active categories
CREATE POLICY "Public categories are viewable by everyone"
  ON categories FOR SELECT
  USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for media
-- Everyone can view media
CREATE POLICY "Media is viewable by everyone"
  ON media FOR SELECT
  USING (true);

-- Authenticated users can upload media
CREATE POLICY "Authenticated users can upload media"
  ON media FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Users can delete own media
CREATE POLICY "Users can delete own media"
  ON media FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Admins have full access to media
CREATE POLICY "Admins have full access to media"
  ON media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for tags
-- Everyone can read tags
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

-- Authenticated users can create tags
CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for TV programs
-- Everyone can view published programs
CREATE POLICY "Published TV programs are viewable by everyone"
  ON tv_programs FOR SELECT
  USING (published_at IS NOT NULL AND published_at <= NOW());

-- Admins can manage TV programs
CREATE POLICY "Admins can manage TV programs"
  ON tv_programs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default categories
INSERT INTO categories (slug, name_bg, name_en, display_order) VALUES
  ('pazardzhik', 'Пазарджик', 'Pazardzhik', 1),
  ('regioni', 'Региони', 'Regions', 2),
  ('bulgaria', 'България', 'Bulgaria', 3),
  ('obshtestvo', 'Общество', 'Society', 4),
  ('krimi', 'Крими', 'Crime', 5),
  ('sport', 'Спорт', 'Sports', 6),
  ('biznes', 'Бизнес', 'Business', 7),
  ('svobodno-vreme', 'Свободно време', 'Leisure', 8),
  ('predavania', 'Предавания', 'TV Programs', 9),
  ('zdrave', 'Здраве', 'Health', 10);

-- Insert regional subcategories
INSERT INTO categories (slug, name_bg, name_en, parent_id, display_order)
SELECT
  slug,
  name_bg,
  name_en,
  (SELECT id FROM categories WHERE slug = 'regioni'),
  display_order
FROM (VALUES
  ('batak', 'Батак', 'Batak', 1),
  ('belovo', 'Белово', 'Belovo', 2),
  ('bratsigovo', 'Брацигово', 'Bratsigovo', 3),
  ('velingrad', 'Велинград', 'Velingrad', 4),
  ('lesichovo', 'Лесичово', 'Lesichovo', 5),
  ('panagyurishte', 'Панагюрище', 'Panagyurishte', 6),
  ('peshtera', 'Пещера', 'Peshtera', 7),
  ('rakitovo', 'Ракитово', 'Rakitovo', 8),
  ('septemvri', 'Септември', 'Septemvri', 9),
  ('strelcha', 'Стрелча', 'Strelcha', 10),
  ('sarnitsa', 'Сърница', 'Sarnitsa', 11)
) AS subcats(slug, name_bg, name_en, display_order);
