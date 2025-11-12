import { supabase } from '@/lib/supabase/client'

interface CategorySubcategoriesProps {
  categoryId: string
  categorySlug: string
}

export async function CategorySubcategories({ categoryId, categorySlug }: CategorySubcategoriesProps) {
  // Get subcategories if this is a parent category
  const { data: subcategories } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', categoryId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const subcategoryList = (subcategories as any[]) || []

  if (subcategoryList.length === 0) {
    return null
  }

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {subcategoryList.map((subcategory) => (
        <a
          key={subcategory.id}
          href={`/${categorySlug}/${subcategory.slug}`}
          className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {subcategory.name_bg}
        </a>
      ))}
    </nav>
  )
}
