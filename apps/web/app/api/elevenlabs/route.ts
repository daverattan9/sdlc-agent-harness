import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { validateElevenLabsSignature } from '@/lib/webhooks/hmac';
import { createBugTicket } from '@/lib/notion/tickets';

export interface ElevenLabsWebhookPayload {
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

interface DataCollectionFields {
  bug_title?: string;
  description?: string;
  steps_to_reproduce?: string;
  severity?: string;
  affected_area?: string;
}

export function extractTicketData(payload: ElevenLabsWebhookPayload) {
  const dc = payload.analysis?.data_collection as DataCollectionFields | undefined;
  const summary = payload.analysis?.summary;

  const str = (v: unknown): string | undefined => {
    if (typeof v === 'string' && v.trim()) return v.trim();
    return undefined;
  };

  return {
    title: str(dc?.bug_title) ?? (summary ? `Bug Report: ${summary.slice(0, 80)}` : 'Bug reported via voice support'),
    description: str(dc?.description) ?? summary ?? 'No description provided',
    stepsToReproduce: str(dc?.steps_to_reproduce),
    severity: str(dc?.severity),
    affectedArea: str(dc?.affected_area),
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

  // Extract structured data from data_collection (falls back to summary)
  const ticketData = extractTicketData(payload);

  // Use full UUID for collision-free ticket IDs
  const ticketId = `TICKET-${uuidv4()}`;

  try {
    const notionPageId = await createBugTicket({
      title: ticketData.title,
      description: ticketData.description,
      transcript: transcriptText,
      reporterId: payload.metadata?.user_id ?? payload.conversation_id,
      ticketId,
      stepsToReproduce: ticketData.stepsToReproduce,
      severity: ticketData.severity,
      affectedArea: ticketData.affectedArea,
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
