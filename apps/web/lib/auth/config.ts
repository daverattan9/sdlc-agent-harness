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
