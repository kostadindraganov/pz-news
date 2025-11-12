import Link from 'next/link'
import { getAllCategories } from '@/lib/cache/queries'

export async function Footer() {
  const categories = await getAllCategories()
  const mainCategories = categories.filter(cat => !cat.parent_id)

  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">PZ-News</h3>
            <p className="text-sm text-muted-foreground">
              Регионална новинарска платформа за Пазарджик и околните райони.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Категории</h3>
            <ul className="space-y-2">
              {mainCategories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/${category.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {category.name_bg}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Бързи връзки</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">
                  За нас
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Контакти
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Политика за поверителност
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
                  Условия за ползване
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Контакти</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: info@pz-news.com</li>
              <li>Телефон: +359 XX XXX XXX</li>
              <li>Адрес: гр. Пазарджик</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} PZ-News. Всички права запазени.</p>
        </div>
      </div>
    </footer>
  )
}
