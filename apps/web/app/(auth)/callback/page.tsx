// app/(auth)/callback/page.tsx
// In Auth0 v4, the callback is handled by the SDK's auto-mounted /auth/callback
// route (registered by the middleware). This page exists as a convenience so
// that any link to /callback still works.

import { redirect } from 'next/navigation';

export default function CallbackPage() {
  redirect('/auth/callback');
}
