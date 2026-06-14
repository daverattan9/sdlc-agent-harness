import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Allow microphone for ElevenLabs voice widget only
  { key: 'Permissions-Policy', value: 'microphone=(self "https://elevenlabs.io")' },
];

const nextConfig: NextConfig = {
  // three / @react-three/* use browser globals (WebGL, canvas) at import time.
  // Turbopack dev mode needs explicit transpilation to avoid corrupting the
  // React Client Manifest and causing the global-error SSR crash.
  // three/@react-three/fiber use browser globals at module scope — transpile so
  // Turbopack dev-mode doesn't corrupt the React Client Manifest.
  // @react-three/drei is intentionally excluded: its source imports next/document
  // (for the drei Html component) which triggers a Next.js invariant error.
  transpilePackages: ['three', '@react-three/fiber'],
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
