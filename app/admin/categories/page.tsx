import { supabaseAdmin } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react'

export default async function CategoriesPage() {
  // Get all categories with parent relationship
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('*, parent:categories(name_bg)')
    .order('display_order', { ascending: true })

  // Separate main categories and subcategories
  const mainCategories = categories?.filter((cat) => !cat.parent_id) || []
  const subcategories = categories?.filter((cat) => cat.parent_id) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Organize your content with categories</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Main Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Main Categories ({mainCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mainCategories.map((category) => {
              const childCount = subcategories.filter(
                (sub) => sub.parent_id === category.id
              ).length

              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FolderTree className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{category.name_bg}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>/{category.slug}</span>
                        {childCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{childCount} subcategories</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Order: {category.display_order}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Regional Subcategories */}
      {subcategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subcategories ({subcategories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subcategories.map((category) => (
                <div key={category.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-semibold">{category.name_bg}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Parent: {category.parent?.name_bg || 'None'}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categories?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {mainCategories.length} main, {subcategories.length} subcategories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {categories?.filter((cat) => cat.is_active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently visible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {categories?.filter((cat) => !cat.is_active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Hidden from public</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
