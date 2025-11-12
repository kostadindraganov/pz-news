import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const status = searchParams.status || 'all'
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 20
  const offset = (page - 1) * limit

  // Build query
  let query = supabaseAdmin
    .from('articles')
    .select('*, author:users(full_name), category:categories(name_bg)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply status filter
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: articles, count } = await query

  const totalPages = Math.ceil((count || 0) / limit)

  // Get counts for filter tabs
  const [publishedCount, draftCount, archivedCount] = await Promise.all([
    supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft'),
    supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'archived'),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Articles</h1>
          <p className="text-muted-foreground">Manage your news articles</p>
        </div>
        <Link href="/admin/articles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <Link
          href="/admin/articles?status=all"
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            status === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({count || 0})
        </Link>
        <Link
          href="/admin/articles?status=published"
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            status === 'published'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Published ({publishedCount.count || 0})
        </Link>
        <Link
          href="/admin/articles?status=draft"
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            status === 'draft'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Drafts ({draftCount.count || 0})
        </Link>
        <Link
          href="/admin/articles?status=archived"
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            status === 'archived'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Archived ({archivedCount.count || 0})
        </Link>
      </div>

      {/* Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Articles List</CardTitle>
        </CardHeader>
        <CardContent>
          {articles && articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{article.title}</h3>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{article.category?.name_bg}</span>
                      <span>•</span>
                      <span>By {article.author?.full_name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatDate(article.created_at)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.view_count}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        article.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : article.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {article.status}
                    </span>
                    <Link href={`/admin/articles/${article.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No articles found</p>
              <Link href="/admin/articles/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first article
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/articles?status=${status}&page=${page - 1}`}>
              <Button variant="outline">Previous</Button>
            </Link>
          )}
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/articles?status=${status}&page=${page + 1}`}>
              <Button variant="outline">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
