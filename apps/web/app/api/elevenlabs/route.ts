import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { createBugTicket } from '@/lib/notion/tickets';

export interface ElevenLabsWebhookPayload {
  type: string;
  event_timestamp: number;
  data: {
    agent_id: string;
    conversation_id: string;
    status: string;
    user_id?: string;
    transcript: Array<{ role: string; message: string; time_in_call_secs?: number }>;
    metadata: {
      start_time_unix_secs?: number;
      call_duration_secs?: number;
      [key: string]: unknown;
    };
    analysis: {
      transcript_summary?: string;
      data_collection_results?: Record<string, unknown>;
      call_successful?: string;
      evaluation_criteria_results?: Record<string, unknown>;
    };
    conversation_initiation_client_data?: Record<string, unknown>;
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
  const dc = payload.data.analysis?.data_collection_results as DataCollectionFields | undefined;
  const summary = payload.data.analysis?.transcript_summary;

  const str = (v: unknown): string | undefined => {
    if (typeof v === 'string' && v.trim()) return v.trim();
    return undefined;
  };

  return {
    title: str(dc?.bug_title) ?? `Bug Report: ${summary?.slice(0, 80)}`,
    description: str(dc?.description) ?? summary ?? '',
    stepsToReproduce: str(dc?.steps_to_reproduce),
    severity: str(dc?.severity),
    affectedArea: str(dc?.affected_area),
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get('elevenlabs-signature') ?? '';
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

  if (!secret) {
    console.error('ELEVENLABS_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const client = new ElevenLabsClient({ apiKey: 'unused' });
  let event: Record<string, unknown>;
  try {
    event = await client.webhooks.constructEvent(rawBody, signatureHeader, secret);
  } catch (err) {
    console.error('ElevenLabs webhook signature validation failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = event as unknown as ElevenLabsWebhookPayload;

  if (payload.type !== 'post_call_transcription') {
    return NextResponse.json({ ok: true, message: 'Event ignored' });
  }

  const { data } = payload;

  const transcriptText = (data.transcript ?? [])
    .map((t) => `${t.role.toUpperCase()}: ${t.message}`)
    .join('\n');

  const ticketData = extractTicketData(payload);
  const ticketId = `TICKET-${uuidv4()}`;

  try {
    const notionPageId = await createBugTicket({
      title: ticketData.title,
      description: ticketData.description,
      transcript: transcriptText,
      reporterId: data.user_id ?? data.conversation_id,
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
