import Link from 'next/link'
import Image from 'next/image'
import { formatRelativeTime, truncate } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Calendar, User, Eye } from 'lucide-react'

interface ArticleCardProps {
  article: {
    id: string
    slug: string
    title: string
    excerpt?: string | null
    content: string
    featured_image_url?: string | null
    featured_image_alt?: string | null
    published_at?: string | null
    view_count?: number | null
    author?: {
      full_name: string
    } | null
    category?: {
      name_bg: string
      slug: string
    } | null
  }
  featured?: boolean
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const imageUrl = article.featured_image_url || '/placeholder-image.jpg'
  const excerpt = article.excerpt || truncate(article.content.replace(/<[^>]*>/g, ''), 150)

  if (featured) {
    return (
      <Link href={`/${article.category?.slug}/${article.slug}`}>
        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <div className="relative h-[400px] w-full">
            <Image
              src={imageUrl}
              alt={article.featured_image_alt || article.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white">
              {article.category && (
                <span className="mb-2 inline-block rounded bg-primary px-3 py-1 text-xs font-semibold">
                  {article.category.name_bg}
                </span>
              )}
              <h2 className="mb-2 text-3xl font-bold">{article.title}</h2>
              <p className="mb-4 text-sm text-gray-200">{excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-gray-300">
                {article.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {article.author.full_name}
                  </span>
                )}
                {article.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatRelativeTime(article.published_at)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.view_count || 0}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/${article.category?.slug}/${article.slug}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
        {article.featured_image_url && (
          <div className="relative h-48 w-full">
            <Image
              src={imageUrl}
              alt={article.featured_image_alt || article.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader className="flex-1">
          {article.category && (
            <span className="mb-2 inline-block w-fit rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {article.category.name_bg}
            </span>
          )}
          <h3 className="line-clamp-2 text-xl font-bold leading-tight">{article.title}</h3>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>
        </CardContent>
        <CardFooter className="flex items-center gap-4 text-xs text-muted-foreground">
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatRelativeTime(article.published_at)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {article.view_count || 0}
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
