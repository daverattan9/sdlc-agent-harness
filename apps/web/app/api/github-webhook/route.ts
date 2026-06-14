import { NextRequest, NextResponse } from 'next/server';
import { validateHmac } from '@/lib/webhooks/hmac';
import { updateTicket } from '@/lib/notion/tickets';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256') ?? '';
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const event = req.headers.get('x-github-event');

  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  if (!validateHmac(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Only handle pull_request events for merges
  if (event !== 'pull_request') {
    return NextResponse.json({ ok: true, message: 'Event ignored' });
  }

  let payload: { action?: string; pull_request?: { merged?: boolean; body?: string; title?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only act on PR closed + merged
  if (payload.action !== 'closed' || !payload.pull_request?.merged) {
    return NextResponse.json({ ok: true, message: 'Not a merge event' });
  }

  // Extract Notion ticket page ID from PR body
  // The Codex worker puts "Notion ticket: TICKET-xxxx" in the PR body
  // We need to look up the Notion page ID from the ticketId
  const prBody = payload.pull_request?.body ?? '';
  const ticketIdMatch = prBody.match(/Notion ticket: (TICKET-[a-zA-Z0-9-]+)/);

  if (!ticketIdMatch) {
    // No ticket reference in PR — ignore
    return NextResponse.json({ ok: true, message: 'No ticket reference found' });
  }

  const ticketId = ticketIdMatch[1];

  // Find the Notion page with this ticketId
  const pageId = await findNotionPageByTicketId(ticketId);
  if (!pageId) {
    console.error(`No Notion page found for ticketId: ${ticketId}`);
    return NextResponse.json({ ok: true, message: 'Ticket not found in Notion' });
  }

  // Update ticket status to Done
  await updateTicket({ pageId, status: 'Done' });

  return NextResponse.json({ ok: true, ticketId, status: 'Done' });
}

async function findNotionPageByTicketId(ticketId: string): Promise<string | null> {
  const { getNotion, getNotionDatabaseId } = await import('@/lib/notion/client');
  const notion = getNotion();

  try {
    const response = await notion.dataSources.query({
      data_source_id: getNotionDatabaseId(),
      filter: {
        property: 'TicketID',
        rich_text: {
          equals: ticketId,
        },
      },
    });

    return response.results[0]?.id ?? null;
  } catch {
    return null;
  }
}
