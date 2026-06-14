import { NextRequest, NextResponse } from 'next/server';
import { validateHmac } from '@/lib/webhooks/hmac';
import { updateTicket } from '@/lib/notion/tickets';

interface NotionWebhookPayload {
  type: string;
  // Status change event (from Notion automation)
  data?: {
    pageId?: string;
    status?: string;
    ticketId?: string;
    findings?: {
      file: string;
      line: number;
      description: string;
      fix: string;
    };
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-notion-signature') ?? '';
  const secret = process.env.NOTION_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  if (!validateHmac(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: NotionWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Handle status change to "In Progress" — dispatch Codex job
  if (payload.type === 'status_change' && payload.data?.status === 'In Progress') {
    const { pageId, ticketId, findings } = payload.data;

    if (!pageId || !ticketId || !findings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Dispatch to Codex worker
    await dispatchCodexJob({
      pageId,
      ticketId,
      findings,
    });

    return NextResponse.json({ ok: true, dispatched: true });
  }

  // Handle GitHub merge event (PR merged → ticket Done)
  if (payload.type === 'pr_merged') {
    const { pageId } = payload.data ?? {};
    if (!pageId) {
      return NextResponse.json({ error: 'Missing pageId' }, { status: 400 });
    }
    await updateTicket({ pageId, status: 'Done' });
    return NextResponse.json({ ok: true, status: 'Done' });
  }

  return NextResponse.json({ ok: true, message: 'Event ignored' });
}

async function dispatchCodexJob(params: {
  pageId: string;
  ticketId: string;
  findings: { file: string; line: number; description: string; fix: string };
}) {
  const workerUrl = process.env.CODEX_WORKER_URL;
  const workerSecret = process.env.CODEX_WORKER_SECRET;

  if (!workerUrl || !workerSecret) {
    throw new Error('CODEX_WORKER_URL or CODEX_WORKER_SECRET not configured');
  }

  // Get ticket title from Notion
  const { getNotion } = await import('@/lib/notion/client');
  const notion = getNotion();
  const page = await notion.pages.retrieve({ page_id: params.pageId }) as {
    properties: {
      Title?: { title: Array<{ plain_text: string }> };
    };
  };
  const title = page.properties.Title?.title?.[0]?.plain_text ?? params.ticketId;

  const response = await fetch(`${workerUrl}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-codex-worker-secret': workerSecret,
    },
    body: JSON.stringify({
      ticketId: params.ticketId,
      ticketTitle: title,
      repoUrl: `https://github.com/${process.env.GITHUB_REPO}`,
      branchBase: 'main',
      findings: params.findings,
    }),
  });

  if (!response.ok) {
    throw new Error(`Codex worker rejected: ${response.status}`);
  }

  // Update Notion ticket to In Review (Codex will create PR)
  await updateTicket({ pageId: params.pageId, status: 'In Review' });
}
