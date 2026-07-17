import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Paths
  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  const isPublicVerifyApi = pathname.startsWith('/api/verify');
  const isAuthApi = pathname.startsWith('/api/auth');

  // Verify JWT token if present
  let userPayload = null;
  if (token) {
    userPayload = await verifyToken(token);
  }

  // Redirect visitors trying to browse private dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!userPayload) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // RBAC: Restricted admin pages
    if (pathname.startsWith('/dashboard/admin') && userPayload.role !== 'ADMIN') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    
    // RBAC: Analyst consoles restricted to ADMIN and ANALYST
    if (pathname.startsWith('/dashboard/analyze') && !['ADMIN', 'ANALYST'].includes(userPayload.role)) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated sessions away from registration and login screens
  if ((isLoginPage || isRegisterPage) && userPayload) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Secure internal REST APIs
  if (pathname.startsWith('/api') && !isAuthApi && !isPublicVerifyApi) {
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized verification session' }, { status: 401 });
    }

    // Admin audit APIs
    if (pathname.startsWith('/api/audit') && userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Administrative scope required' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

/**
 * Configure paths this middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /_next/static (static files)
     * 2. /_next/image (image optimization files)
     * 3. /favicon.ico, /next.svg, /vercel.svg (theme/static files)
     */
    '/((?!_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)',
  ],
};
