# Database Seeding Scripts

This directory contains scripts to seed the database with demo data.

## Prerequisites

Before running the seed script, make sure you have:

1. **Environment variables** set up in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (required for seeding, bypasses RLS)

2. **Database migrations** applied (categories should exist in the database)

3. **Dependencies installed**:
   ```bash
   npm install
   ```

## Available Scripts

### `seed-demo.ts`

Seeds the database with one demo news article including:
- A demo user (author)
- A published news article in Bulgarian
- Featured image from Unsplash
- Tags for the article
- Assigns to an existing category

**Usage:**

```bash
npm run seed
```

**What it creates:**

- **User:** `demo@pz-news.com` (author role)
- **Article:** "Пазарджик – Сърцето на Тракийската долина"
  - Full content in Bulgarian
  - Featured image
  - Published status
  - Marked as featured article
- **Tags:** "Пазарджик", "Тракийска долина", "История"

**Idempotency:**

The script is idempotent - running it multiple times will NOT create duplicate articles. It checks if the article already exists before creating it.

## Notes

- The script uses the **service role key** to bypass Row Level Security (RLS)
- The demo article uses a placeholder image from Unsplash
- The password hash for the demo user is a dummy value (not used for actual authentication)
- If you need to reset, manually delete the demo article from Supabase dashboard

## Troubleshooting

**"SUPABASE_SERVICE_ROLE_KEY is not set"**
- Make sure you have `.env.local` file with `SUPABASE_SERVICE_ROLE_KEY` defined
- Get the service role key from your Supabase project settings

**"No categories found"**
- Run the database migrations first: `supabase db push`
- Check that categories exist in the database

**"Error creating article"**
- Check the console output for specific error details
- Verify RLS policies allow service role to insert data
- Check that all required fields are provided
