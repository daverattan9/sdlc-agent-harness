// app/(auth)/logout/page.tsx
// In Auth0 v4, logout is handled by the SDK's auto-mounted /auth/logout
// route (registered by the middleware). This page is a convenience redirect.

import { redirect } from 'next/navigation';

export default function LogoutPage() {
  redirect('/auth/logout');
}
