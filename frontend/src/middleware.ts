import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js edge middleware — enforces route-level access control.
 *
 * Protected paths redirect to /login when the session cookie is absent.
 * The /login page redirects to /dashboard when already authenticated.
 *
 * NOTE: We cannot run MSAL here (edge runtime, no DOM).
 *       We rely on a lightweight session indicator cookie set after login.
 *       The actual token validation happens in the backend on every API call.
 */

const PROTECTED_PATHS = ['/dashboard', '/settings'];
const AUTH_PATHS = ['/login'];

// The session indicator cookie — set by the frontend after successful login,
// cleared by the frontend on logout. Does NOT contain a token.
const SESSION_COOKIE = 'm365admin.session';

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (Next.js assets)
     * - _next/image   (Next.js image optimization)
     * - favicon.ico
     * - auth/callback (MSAL redirect handler — must be public)
     * - api/*         (API routes handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|api/).*)',
  ],
};
