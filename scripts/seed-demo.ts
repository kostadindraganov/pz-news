#!/usr/bin/env tsx

/**
 * Seed Script - Demo News Article
 *
 * This script creates a demo news article with an image in a category.
 * Run with: npm run seed
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set')
  process.exit(1)
}

// Create admin client with service role key (bypasses RLS)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

/**
 * Generate a unique slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .trim()
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting database seeding...\n')

  try {
    // Step 1: Get or create a demo user (author)
    console.log('👤 Creating demo user...')

    const demoEmail = 'demo@pz-news.com'
    let userId: string

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', demoEmail)
      .single()

    if (existingUser) {
      console.log('✓ Demo user already exists')
      userId = existingUser.id
    } else {
      // Create demo user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: demoEmail,
          full_name: 'Demo Author',
          role: 'author',
          is_active: true,
          password_hash: 'dummy_hash_for_seed', // Not used for real authentication
        })
        .select('id')
        .single()

      if (userError) {
        console.error('❌ Error creating user:', userError)
        throw userError
      }

      userId = newUser.id
      console.log('✓ Demo user created')
    }

    // Step 2: Get first available category
    console.log('\n📁 Fetching categories...')

    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('id, slug, name_bg')
      .eq('is_active', true)
      .is('parent_id', null) // Get only main categories, not subcategories
      .limit(1)

    if (categoryError || !categories || categories.length === 0) {
      console.error('❌ Error fetching categories:', categoryError)
      throw categoryError || new Error('No categories found')
    }

    const category = categories[0]
    console.log(`✓ Using category: ${category.name_bg} (${category.slug})`)

    // Step 3: Create demo article
    console.log('\n📰 Creating demo article...')

    const articleTitle = 'Пазарджик – Сърцето на Тракийската долина'
    const articleSlug = generateSlug(articleTitle)

    // Check if article already exists
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id, title')
      .eq('slug', articleSlug)
      .single()

    if (existingArticle) {
      console.log('⚠️  Demo article already exists:', existingArticle.title)
      console.log('\n✅ Seeding completed (no new data added)')
      return
    }

    const articleData = {
      slug: articleSlug,
      title: articleTitle,
      subtitle: 'История, култура и модерно развитие в един от най-живописните градове на България',
      excerpt: 'Пазарджик е град с богата история, разположен в сърцето на Тракийската долина. Градът съчетава уникално историческо наследство с модерно развитие, предлагайки на своите жители и гости както културни забележителности, така и възможности за бизнес и туризъм.',
      content: `
<h2>История на града</h2>
<p>Пазарджик е основан през 1485 година от османския везир Шехабедин паша. Градът бързо се превръща в важен търговски център благодарение на своето стратегическо местоположение на пътя между Европа и Изтока.</p>

<p>През вековете градът процъфтява като занаятчийски и търговски център. След Освобождението през 1878 година, Пазарджик продължава да се развива като важен икономически и културен център на региона.</p>

<h2>Културно наследство</h2>
<p>Днес градът е известен със своите музеи, галерии и културни институции. Музейният комплекс "Станислав Доспевски" предлага богата колекция от произведения на изкуството, докато Етнографският музей запазва традициите и бита на региона.</p>

<h2>Модерно развитие</h2>
<p>В последните години Пазарджик се превръща в модерен град с развиваща се инфраструктура. Градът привлича инвеститори благодарение на своето местоположение и квалифицирана работна ръка.</p>

<p>Тракийската долина предлага отлични условия за земеделие, а градът се развива като важен център за хранително-вкусовата промишленост.</p>

<h2>Туристически атракции</h2>
<ul>
  <li>Градската градина с паметника на Станислав Доспевски</li>
  <li>Старинният занаятчийски център</li>
  <li>Природен парк "Тракийска Света гора" в близост до града</li>
  <li>Минералните бани в региона</li>
</ul>

<p>Пазарджик продължава да се развива като привлекателна дестинация за туризъм и място за живеене, съчетавайки историческо наследство с модерни удобства.</p>
      `.trim(),
      featured_image_url: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1200&h=800&fit=crop',
      featured_image_alt: 'Изглед на град Пазарджик и Тракийската долина',
      author_id: userId,
      category_id: category.id,
      status: 'published',
      is_featured: true,
      is_breaking: false,
      view_count: 0,
      published_at: new Date().toISOString(),
      meta_title: 'Пазарджик – История, култура и развитие | PZ News',
      meta_description: 'Разгледайте историята и съвременното развитие на Пазарджик, един от най-живописните градове в Тракийската долина.',
      meta_keywords: ['Пазарджик', 'Тракийска долина', 'история', 'култура', 'туризъм', 'България'],
    }

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert(articleData)
      .select('id, title, slug')
      .single()

    if (articleError) {
      console.error('❌ Error creating article:', articleError)
      throw articleError
    }

    console.log('✓ Demo article created successfully!')
    console.log(`  ID: ${article.id}`)
    console.log(`  Title: ${article.title}`)
    console.log(`  Slug: ${article.slug}`)

    // Step 4: Add some tags
    console.log('\n🏷️  Adding tags...')

    const tags = ['Пазарджик', 'Тракийска долина', 'История']
    const tagIds: string[] = []

    for (const tagName of tags) {
      const tagSlug = generateSlug(tagName)

      // Check if tag exists
      let { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', tagSlug)
        .single()

      let tagId: string

      if (existingTag) {
        tagId = existingTag.id
      } else {
        // Create tag
        const { data: newTag, error: tagError } = await supabase
          .from('tags')
          .insert({ slug: tagSlug, name: tagName })
          .select('id')
          .single()

        if (tagError) {
          console.error(`❌ Error creating tag "${tagName}":`, tagError)
          continue
        }

        tagId = newTag.id
      }

      tagIds.push(tagId)
    }

    // Link tags to article
    if (tagIds.length > 0) {
      const articleTags = tagIds.map(tagId => ({
        article_id: article.id,
        tag_id: tagId,
      }))

      const { error: linkError } = await supabase
        .from('article_tags')
        .insert(articleTags)

      if (linkError) {
        console.error('❌ Error linking tags:', linkError)
      } else {
        console.log(`✓ Added ${tagIds.length} tags to article`)
      }
    }

    console.log('\n✅ Seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   User: ${demoEmail}`)
    console.log(`   Category: ${category.name_bg}`)
    console.log(`   Article: ${article.title}`)
    console.log(`   Tags: ${tags.join(', ')}`)

  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('\n👋 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
