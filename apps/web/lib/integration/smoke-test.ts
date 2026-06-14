// lib/integration/smoke-test.ts
// Verify all required environment variables and integrations are configured.
// Run with: npx tsx lib/integration/smoke-test.ts

interface IntegrationCheck {
  name: string;
  required: boolean;
  configured: boolean;
}

export function checkIntegrations(): IntegrationCheck[] {
  return [
    { name: 'AUTH0_SECRET', required: true, configured: !!process.env.AUTH0_SECRET },
    { name: 'AUTH0_DOMAIN', required: true, configured: !!process.env.AUTH0_DOMAIN },
    { name: 'AUTH0_CLIENT_ID', required: true, configured: !!process.env.AUTH0_CLIENT_ID },
    { name: 'AUTH0_CLIENT_SECRET', required: true, configured: !!process.env.AUTH0_CLIENT_SECRET },
    { name: 'APP_BASE_URL', required: true, configured: !!process.env.APP_BASE_URL },
    { name: 'NOTION_API_KEY', required: true, configured: !!process.env.NOTION_API_KEY },
    { name: 'NOTION_DATABASE_ID', required: true, configured: !!process.env.NOTION_DATABASE_ID },
    {
      name: 'NOTION_WEBHOOK_SECRET',
      required: true,
      configured: !!process.env.NOTION_WEBHOOK_SECRET,
    },
    {
      name: 'ELEVENLABS_WEBHOOK_SECRET',
      required: true,
      configured: !!process.env.ELEVENLABS_WEBHOOK_SECRET,
    },
    {
      name: 'NEXT_PUBLIC_ELEVENLABS_AGENT_ID',
      required: false,
      configured: !!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
    },
    { name: 'ANTHROPIC_API_KEY', required: true, configured: !!process.env.ANTHROPIC_API_KEY },
    { name: 'GITHUB_TOKEN', required: true, configured: !!process.env.GITHUB_TOKEN },
    { name: 'GITHUB_REPO', required: true, configured: !!process.env.GITHUB_REPO },
    {
      name: 'GITHUB_WEBHOOK_SECRET',
      required: true,
      configured: !!process.env.GITHUB_WEBHOOK_SECRET,
    },
    { name: 'CODEX_WORKER_URL', required: true, configured: !!process.env.CODEX_WORKER_URL },
    { name: 'CODEX_WORKER_SECRET', required: true, configured: !!process.env.CODEX_WORKER_SECRET },
  ];
}

if (require.main === module) {
  const checks = checkIntegrations();
  const missing = checks.filter(c => c.required && !c.configured);
  const optional = checks.filter(c => !c.required && !c.configured);

  console.log('\n=== SDLC Harness Integration Check ===\n');
  for (const check of checks) {
    const icon = check.configured ? '✅' : check.required ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}`);
  }

  console.log(`\n${missing.length} required env vars missing`);
  if (optional.length) console.log(`${optional.length} optional env vars not set`);

  if (missing.length > 0) process.exit(1);
}
