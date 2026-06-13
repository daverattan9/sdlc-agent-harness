// lib/auth0.ts
// Single Auth0Client instance for the whole app (Auth0 v4 pattern).
// Import `auth0` from here everywhere — never instantiate a second client.

import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client();
