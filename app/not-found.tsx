import { Button } from '@/components/ui/button'
import { FileQuestion, Home, Search } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
