import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { extractTicketData } from '../route';
import { createBugTicket } from '@/lib/notion/tickets';
import type { ElevenLabsWebhookPayload } from '../route';

interface TestPayload {
  data_collection?: Record<string, unknown>;
  summary?: string;
  transcript?: Array<{ role: string; message: string }>;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: TestPayload;
  try {
    body = (await req.json()) as TestPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Build a synthetic webhook payload from the test input
  const payload: ElevenLabsWebhookPayload = {
    type: 'conversation_ended',
    conversation_id: `test-${uuidv4()}`,
    agent_id: 'test-agent',
    transcript: body.transcript ?? [
      { role: 'user', message: 'Test bug report' },
      { role: 'agent', message: 'I will create a ticket for that.' },
    ],
    analysis: {
      summary: body.summary,
      data_collection: body.data_collection,
    },
  };

  const ticketData = extractTicketData(payload);

  const transcriptText = (payload.transcript ?? [])
    .map((t) => `${t.role.toUpperCase()}: ${t.message}`)
    .join('\n');

  const ticketId = `TICKET-${uuidv4()}`;

  try {
    const notionPageId = await createBugTicket({
      title: ticketData.title,
      description: ticketData.description,
      transcript: transcriptText,
      reporterId: 'test-user',
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
    console.error('Failed to create test Notion ticket:', err);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
