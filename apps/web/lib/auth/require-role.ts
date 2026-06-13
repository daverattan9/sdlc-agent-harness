// lib/auth/require-role.ts
// Server-side helper that wraps Next.js App Router API route handlers
// to enforce role-based access control.
//
// Usage:
//   export const POST = requireRole('developer', async (req) => { ... });

import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

import { ROLES_CLAIM, type Role } from '@/lib/auth/config';

type RouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<NextResponse | Response>;

/**
 * Wraps an API route handler to require the caller to be authenticated
 * and to have the given role in their JWT's custom roles claim.
 *
 * Returns:
 *   401  — no active session
 *   403  — session exists but role does not match
 *   otherwise — delegates to the wrapped handler
 */
export function requireRole(role: Role, handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const session = await auth0.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles: string[] = (session.user[ROLES_CLAIM] as string[]) ?? [];

    if (!userRoles.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(req, ctx);
  };
}
