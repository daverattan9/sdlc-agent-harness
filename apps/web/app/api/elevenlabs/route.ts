import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { validateElevenLabsSignature } from '@/lib/webhooks/hmac';
import { createBugTicket } from '@/lib/notion/tickets';

interface ElevenLabsWebhookPayload {
  type: string;
  conversation_id: string;
  agent_id: string;
  transcript?: Array<{ role: string; message: string }>;
  analysis?: {
    summary?: string;
    data_collection?: Record<string, unknown>;
  };
  metadata?: {
    user_id?: string;
    [key: string]: unknown;
  };
}

export async function POST(req: NextRequest) {
  // Read raw body for HMAC validation
  const rawBody = await req.text();

  const signatureHeader = req.headers.get('elevenlabs-signature') ?? '';
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

  // Signature validation is always required — reject if secret is not configured
  if (!secret) {
    console.error('ELEVENLABS_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  if (!validateElevenLabsSignature(rawBody, signatureHeader, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: ElevenLabsWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ElevenLabsWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only process conversation_ended events
  if (payload.type !== 'conversation_ended') {
    return NextResponse.json({ ok: true, message: 'Event ignored' });
  }

  // Build transcript string
  const transcriptText = (payload.transcript ?? [])
    .map((t) => `${t.role.toUpperCase()}: ${t.message}`)
    .join('\n');

  // Extract bug description from analysis or transcript
  const bugDescription =
    payload.analysis?.summary ?? 'Bug reported via voice support call';

  // Use full UUID for collision-free ticket IDs
  const ticketId = `TICKET-${uuidv4()}`;

  try {
    const notionPageId = await createBugTicket({
      title: `Bug Report: ${bugDescription.slice(0, 80)}`,
      description: bugDescription,
      transcript: transcriptText,
      reporterId: payload.metadata?.user_id ?? payload.conversation_id,
      ticketId,
    });

    return NextResponse.json({
      ok: true,
      ticketId,
      notionPageId,
    });
  } catch (err) {
    console.error('Failed to create Notion ticket:', err);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
