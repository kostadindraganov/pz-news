import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabaseAdmin } from '@/lib/supabase/client'
import { FileText, Eye, Users, FolderTree } from 'lucide-react'

export default async function AdminDashboard() {
  // Get statistics
  const [articlesResult, viewsResult, usersResult, categoriesResult] = await Promise.all([
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('articles').select('view_count'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  const totalArticles = articlesResult.count || 0
  const publishedArticles =
    (
      await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
    ).count || 0
  const draftArticles =
    (
      await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
    ).count || 0

  const totalViews =
    viewsResult.data?.reduce((sum, article) => sum + (article.view_count || 0), 0) || 0
  const totalUsers = usersResult.count || 0
  const totalCategories = categoriesResult.count || 0

  // Get recent articles
  const { data: recentArticles } = await supabaseAdmin
    .from('articles')
    .select('id, title, status, created_at, author:users(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      title: 'Total Articles',
      value: totalArticles,
      description: `${publishedArticles} published, ${draftArticles} drafts`,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Total Views',
      value: totalViews.toLocaleString(),
      description: 'Across all articles',
      icon: Eye,
      color: 'text-green-600',
    },
    {
      title: 'Users',
      value: totalUsers,
      description: 'Registered users',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Categories',
      value: totalCategories,
      description: 'Active categories',
      icon: FolderTree,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to PZ-News admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Articles</CardTitle>
        </CardHeader>
        <CardContent>
          {recentArticles && recentArticles.length > 0 ? (
            <div className="space-y-4">
              {recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{article.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      By {article.author?.full_name || 'Unknown'} •{' '}
                      {new Date(article.created_at).toLocaleDateString('bg-BG')}
                    </p>
                  </div>
                  <div>
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No articles yet</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cursor-pointer transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              New Article
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create a new article and publish it to your website
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Manage Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add, edit, or remove users and manage permissions
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-primary" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Organize your content with categories and tags
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
