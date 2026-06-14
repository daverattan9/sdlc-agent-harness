// proxy.ts  (Next.js 16: replaces middleware.ts)
// Auth0 v4 — the proxy is the central auth handler.
// It auto-mounts /auth/login, /auth/logout, /auth/callback, /auth/profile.

import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Auth0 handle its own /auth/* routes first.
  const authResponse = await auth0.middleware(request);

  if (pathname.startsWith('/auth')) {
    return authResponse;
  }

  // /dashboard requires an authenticated session.
  if (pathname.startsWith('/dashboard')) {
    const session = await auth0.getSession().catch(() => null);
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      // Only allow same-origin relative paths as returnTo — prevents open redirect.
      if (pathname.startsWith('/') && !pathname.startsWith('//')) {
        loginUrl.searchParams.set('returnTo', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return authResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
