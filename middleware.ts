import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to protect admin routes
 * Checks for authentication before allowing access to /admin/* paths
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // Check for auth cookie/session
    const authCookie = request.cookies.get('auth-token')

    if (!authCookie) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // TODO: Verify session with better-auth
    // For now, just check if cookie exists
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Exclude static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
