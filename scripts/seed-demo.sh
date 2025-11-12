#!/bin/bash

set -e

SUPABASE_URL="https://cbmpdqbalsttfhpimbbc.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibXBkcWJhbHN0dGZocGltYmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk1NTIwOSwiZXhwIjoyMDc4NTMxMjA5fQ.uHTiITETPkZyGGUwQGYSnZSqwca-KQCvPRuImy3UVCQ"

echo "🌱 Starting database seeding..."
echo ""

# Step 1: Get or create demo user
echo "👤 Creating demo user..."
DEMO_EMAIL="demo@pz-news.com"

# Check if user exists
USER_RESPONSE=$(curl -s -X GET "$SUPABASE_URL/rest/v1/users?select=id&email=eq.$DEMO_EMAIL" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json")

USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  # Create user
  USER_CREATE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/users" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{
      \"email\": \"$DEMO_EMAIL\",
      \"full_name\": \"Demo Author\",
      \"role\": \"author\",
      \"is_active\": true,
      \"password_hash\": \"dummy_hash_for_seed\"
    }")

  USER_ID=$(echo "$USER_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "✓ Demo user created"
else
  echo "✓ Demo user already exists"
fi

echo "  User ID: $USER_ID"

# Step 2: Get first available category
echo ""
echo "📁 Fetching categories..."

CATEGORY_RESPONSE=$(curl -s -X GET "$SUPABASE_URL/rest/v1/categories?select=id,slug,name_bg&is_active=eq.true&parent_id=is.null&limit=1" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")

CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
CATEGORY_NAME=$(echo "$CATEGORY_RESPONSE" | grep -o '"name_bg":"[^"]*"' | head -1 | cut -d'"' -f4)
CATEGORY_SLUG=$(echo "$CATEGORY_RESPONSE" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CATEGORY_ID" ]; then
  echo "❌ No categories found"
  exit 1
fi

echo "✓ Using category: $CATEGORY_NAME ($CATEGORY_SLUG)"

# Step 3: Create demo article
echo ""
echo "📰 Creating demo article..."

ARTICLE_TITLE="Пазарджик – Сърцето на Тракийската долина"
ARTICLE_SLUG="pazardzhik-sartseto-na-trakiiskata-dolina"

# Check if article already exists
EXISTING_ARTICLE=$(curl -s -X GET "$SUPABASE_URL/rest/v1/articles?select=id,title&slug=eq.$ARTICLE_SLUG" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")

if echo "$EXISTING_ARTICLE" | grep -q "\"id\":"; then
  echo "⚠️  Demo article already exists"
  echo ""
  echo "✅ Seeding completed (no new data added)"
  exit 0
fi

ARTICLE_CONTENT='<h2>История на града</h2>
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

<p>Пазарджик продължава да се развива като привлекателна дестинация за туризъм и място за живеене, съчетавайки историческо наследство с модерни удобства.</p>'

PUBLISHED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Create article
ARTICLE_CREATE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/articles" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"slug\": \"$ARTICLE_SLUG\",
    \"title\": \"$ARTICLE_TITLE\",
    \"subtitle\": \"История, култура и модерно развитие в един от най-живописните градове на България\",
    \"excerpt\": \"Пазарджик е град с богата история, разположен в сърцето на Тракийската долина. Градът съчетава уникално историческо наследство с модерно развитие, предлагайки на своите жители и гости както културни забележителности, така и възможности за бизнес и туризъм.\",
    \"content\": $(echo "$ARTICLE_CONTENT" | jq -Rs .),
    \"featured_image_url\": \"https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1200&h=800&fit=crop\",
    \"featured_image_alt\": \"Изглед на град Пазарджик и Тракийската долина\",
    \"author_id\": \"$USER_ID\",
    \"category_id\": \"$CATEGORY_ID\",
    \"status\": \"published\",
    \"is_featured\": true,
    \"is_breaking\": false,
    \"view_count\": 0,
    \"published_at\": \"$PUBLISHED_AT\",
    \"meta_title\": \"Пазарджик – История, култура и развитие | PZ News\",
    \"meta_description\": \"Разгледайте историята и съвременното развитие на Пазарджик, един от най-живописните градове в Тракийската долина.\",
    \"meta_keywords\": [\"Пазарджик\", \"Тракийска долина\", \"история\", \"култура\", \"туризъм\", \"България\"]
  }")

ARTICLE_ID=$(echo "$ARTICLE_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ARTICLE_ID" ]; then
  echo "❌ Error creating article"
  echo "$ARTICLE_CREATE"
  exit 1
fi

echo "✓ Demo article created successfully!"
echo "  ID: $ARTICLE_ID"
echo "  Title: $ARTICLE_TITLE"
echo "  Slug: $ARTICLE_SLUG"

# Step 4: Add tags
echo ""
echo "🏷️  Adding tags..."

TAGS=("Пазарджик" "Тракийска долина" "История")
TAG_SLUGS=("pazardzhik" "trakiiska-dolina" "istoriia")
TAG_IDS=()

for i in "${!TAGS[@]}"; do
  TAG_NAME="${TAGS[$i]}"
  TAG_SLUG="${TAG_SLUGS[$i]}"

  # Check if tag exists
  TAG_CHECK=$(curl -s -X GET "$SUPABASE_URL/rest/v1/tags?select=id&slug=eq.$TAG_SLUG" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY")

  TAG_ID=$(echo "$TAG_CHECK" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$TAG_ID" ]; then
    # Create tag
    TAG_CREATE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/tags" \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "{\"slug\": \"$TAG_SLUG\", \"name\": \"$TAG_NAME\"}")

    TAG_ID=$(echo "$TAG_CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  fi

  TAG_IDS+=("$TAG_ID")
done

# Link tags to article
for TAG_ID in "${TAG_IDS[@]}"; do
  curl -s -X POST "$SUPABASE_URL/rest/v1/article_tags" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"article_id\": \"$ARTICLE_ID\", \"tag_id\": \"$TAG_ID\"}" > /dev/null
done

echo "✓ Added ${#TAG_IDS[@]} tags to article"

echo ""
echo "✅ Seeding completed successfully!"
echo ""
echo "📊 Summary:"
echo "   User: $DEMO_EMAIL"
echo "   Category: $CATEGORY_NAME"
echo "   Article: $ARTICLE_TITLE"
echo "   Tags: ${TAGS[*]}"
echo ""
echo "👋 Done!"
