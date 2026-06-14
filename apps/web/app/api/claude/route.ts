// app/api/claude/route.ts
// Internal webhook endpoint called by Notion automations to trigger the
// Claude research agent. Protected by HMAC-SHA256 signature.

import { NextRequest, NextResponse } from 'next/server';
import { validateHmac } from '@/lib/webhooks/hmac';
import { runResearchAgent } from '@/lib/claude/agent';

export async function POST(req: NextRequest) {
  // Read raw body before any parsing so HMAC can be validated over the
  // exact bytes that were signed.
  const rawBody = await req.text();
  const signature = req.headers.get('x-notion-signature') ?? '';
  const secret = process.env.NOTION_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  if (!validateHmac(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: { notionPageId: string; bugDescription: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.notionPageId) {
    return NextResponse.json({ error: 'notionPageId required' }, { status: 400 });
  }

  try {
    const result = await runResearchAgent({
      notionPageId: body.notionPageId,
      bugDescription: body.bugDescription ?? 'Investigate the Notion ticket for bug details',
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('Research agent failed:', err);
    return NextResponse.json({ error: 'Agent failed' }, { status: 500 });
  }
}

