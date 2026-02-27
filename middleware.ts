import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const protectedBarberPath = /^\/barber(\/.*)?$/
const protectedApiPath =
  /^\/api\/users\/[^/]+\/(stamp|redeem)$|^\/api\/scan\/resolve$/

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'same-origin')
  return response
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const needsAuth =
    (protectedBarberPath.test(pathname) && pathname !== '/barber/login')
    || protectedApiPath.test(pathname)

  if (!needsAuth) {
    return applySecurityHeaders(response)
  }

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      )
    }

    const url = request.nextUrl.clone()
    url.pathname = '/barber/login'
    url.searchParams.set('next', pathname)
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  return applySecurityHeaders(response)
}

export const config = {
  matcher: ['/barber/:path*', '/api/users/:path*', '/api/scan/:path*'],
}
