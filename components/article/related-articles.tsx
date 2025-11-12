import { supabase } from '@/lib/supabase/client'
import { ArticleGrid } from '@/components/article/article-grid'

interface RelatedArticlesProps {
  categoryId: string
  currentArticleId: string
}

export async function RelatedArticles({ categoryId, currentArticleId }: RelatedArticlesProps) {
  // Get related articles from the same category
  const { data: relatedArticles } = await supabase
    .from('articles')
    .select('*, author:users(*), category:categories(*)')
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .neq('id', currentArticleId)
    .order('published_at', { ascending: false })
    .limit(3)

  if (!relatedArticles || relatedArticles.length === 0) {
    return null
  }

  return (
    <section className="mt-16">
      <h2 className="mb-6 text-2xl font-bold">Свързани статии</h2>
      <ArticleGrid articles={relatedArticles} columns={3} />
    </section>
  )
}
