import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';

interface CodexDispatchPayload {
  ticketId: string;
  ticketTitle: string;
  notionPageId: string;
  findings: {
    file: string;
    line: number;
    description: string;
    fix: string;
  };
}

async function handler(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string | string[]>> },
) {
  const workerUrl = process.env.CODEX_WORKER_URL;
  const workerSecret = process.env.CODEX_WORKER_SECRET;

  if (!workerUrl || !workerSecret) {
    return NextResponse.json({ error: 'Codex worker not configured' }, { status: 503 });
  }

  let body: CodexDispatchPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const jobPayload = {
    ticketId: body.ticketId,
    ticketTitle: body.ticketTitle,
    repoUrl: `https://github.com/${process.env.GITHUB_REPO}`,
    branchBase: 'main',
    findings: body.findings,
  };

  try {
    const response = await fetch(`${workerUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-codex-worker-secret': workerSecret,
      },
      body: JSON.stringify(jobPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Codex worker rejected job: ${error}` },
        { status: 502 }
      );
    }

    const result = await response.json();
    return NextResponse.json({ ok: true, jobId: result.jobId });
  } catch (err) {
    console.error('Failed to dispatch Codex job:', err);
    return NextResponse.json({ error: 'Failed to reach Codex worker' }, { status: 502 });
  }
}

export const POST = requireRole('developer', handler);
