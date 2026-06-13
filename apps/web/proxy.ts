// proxy.ts  (Next.js 16: replaces middleware.ts)
// Auth0 v4 — the proxy is the central auth handler.
// It auto-mounts /auth/login, /auth/logout, /auth/callback, /auth/profile.
// Route protection is added on top via custom checks.

import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { ROLES_CLAIM, ROLES } from '@/lib/auth/config';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Auth0 handle its own /auth/* routes first.
  const authResponse = await auth0.middleware(request);

  // If Auth0 is handling this request (e.g. /auth/callback), return its response.
  if (authResponse.status !== 200 || pathname.startsWith('/auth')) {
    return authResponse;
  }

  // --- Route protection ---

  // /dashboard requires any authenticated user.
  if (pathname.startsWith('/dashboard')) {
    const session = await auth0.getSession();
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return authResponse;
  }

  // /developer requires the 'developer' role.
  if (pathname.startsWith('/developer')) {
    const session = await auth0.getSession();
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const userRoles: string[] = (session.user[ROLES_CLAIM] as string[]) ?? [];
    if (!userRoles.includes(ROLES.DEVELOPER)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return authResponse;
  }

  return authResponse;
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files.
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
