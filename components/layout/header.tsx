import Link from 'next/link'
import { getAllCategories } from '@/lib/cache/queries'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function Header() {
  const categories = await getAllCategories()

  // Separate main categories and regional subcategories
  const mainCategories = categories.filter(cat => !cat.parent_id)
  const regionalCategory = mainCategories.find(cat => cat.slug === 'regioni')
  const regionalSubcategories = categories.filter(
    cat => cat.parent_id === regionalCategory?.id
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">PZ-News</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {mainCategories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/${category.slug}`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {category.name_bg}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Secondary navigation bar */}
      <div className="border-t bg-muted/40">
        <div className="container">
          <nav className="flex h-10 items-center gap-4 overflow-x-auto text-sm">
            <Link
              href="/regioni"
              className="font-medium text-muted-foreground hover:text-primary whitespace-nowrap"
            >
              Региони:
            </Link>
            {regionalSubcategories.map((subcategory) => (
              <Link
                key={subcategory.id}
                href={`/regioni/${subcategory.slug}`}
                className="text-muted-foreground hover:text-primary whitespace-nowrap"
              >
                {subcategory.name_bg}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
