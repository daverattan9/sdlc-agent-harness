// lib/auth/config.ts
// Auth0 v4 uses AUTH0_* env vars directly when creating the Auth0Client.
// This file exports role constants and checking utilities.

export const ROLES = {
  END_USER: 'end-user',
  DEVELOPER: 'developer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// The custom claim namespace used in Auth0 Actions to attach roles to the JWT.
// Set this in your Auth0 dashboard Action:
//   event.user.app_metadata.roles → added to the token at this namespace.
export const ROLES_CLAIM = 'https://sdlc-harness/roles';

/**
 * Safely extracts the roles array from a JWT user payload.
 * Guards against non-array claim values (string, null, number) that could
 * cause type-confusion via String.prototype.includes or Array.prototype.includes.
 */
export function getRolesFromClaim(user: Record<string, unknown>): string[] {
  const claim = user[ROLES_CLAIM];
  if (!Array.isArray(claim)) return [];
  return claim.filter((r): r is string => typeof r === 'string');
}
