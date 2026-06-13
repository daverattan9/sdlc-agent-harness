// app/(auth)/login/page.tsx
// In Auth0 v4, the actual login flow is handled by the SDK's auto-mounted
// /auth/login route (registered by the middleware). This page exists as a
// convenience redirect so that Next.js links to /login still work.

import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/auth/login');
}
