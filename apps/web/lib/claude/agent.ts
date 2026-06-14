// lib/claude/agent.ts
// Claude research agent that investigates bug tickets using GitHub code search
// and writes findings back to Notion.
//
// AI SDK v6 breaking changes vs v5:
//   - tool() uses `inputSchema` instead of `parameters`
//   - generateText uses `stopWhen: stepCountIs(N)` instead of `maxSteps: N`

import { generateText, tool, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { getNotion } from '@/lib/notion/client';
import { updateTicket } from '@/lib/notion/tickets';
import type { TicketStatus } from '@/lib/notion/tickets';

export interface AgentInput {
  notionPageId: string;
  bugDescription: string;
}

export interface AgentResult {
  file: string;
  line: number;
  description: string;
  fix: string;
  notionPageId: string;
}

// ---------------------------------------------------------------------------
// GitHub helpers
// ---------------------------------------------------------------------------

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ---------------------------------------------------------------------------
// Tool definitions (AI SDK v6: inputSchema, not parameters)
// ---------------------------------------------------------------------------

const readGithubFileTool = tool({
  description:
    'Fetch the raw contents of a file from the GitHub repository. ' +
    'Returns the decoded file content as a string.',
  inputSchema: z.object({
    path: z
      .string()
      .describe('File path relative to repo root, e.g. "apps/web/lib/metrics.ts"'),
  }),
  execute: async ({ path }: { path: string }) => {
    const repo = process.env.GITHUB_REPO;
    if (!repo) return { error: 'GITHUB_REPO not configured' };

    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    const res = await fetch(url, { headers: githubHeaders() });

    if (!res.ok) {
      return { error: `GitHub API error ${res.status}: ${await res.text()}` };
    }

    const data = (await res.json()) as {
      content?: string;
      encoding?: string;
      message?: string;
    };

    if (data.message) {
      return { error: data.message };
    }

    if (data.encoding === 'base64' && data.content) {
      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      return { content: decoded, path };
    }

    return { error: 'Unexpected response format from GitHub' };
  },
});

const searchGithubCodeTool = tool({
  description:
    'Search for code patterns in the GitHub repository using the GitHub code search API. ' +
    'Returns a list of matching files with their paths and relevant snippets.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Search query string, e.g. "Math.floor conversion" or "calculateConversionRate"',
      ),
  }),
  execute: async ({ query }: { query: string }) => {
    const repo = process.env.GITHUB_REPO;
    if (!repo) return { error: 'GITHUB_REPO not configured' };

    const q = encodeURIComponent(`${query} repo:${repo}`);
    const url = `https://api.github.com/search/code?q=${q}`;
    const res = await fetch(url, { headers: githubHeaders() });

    if (!res.ok) {
      return { error: `GitHub search API error ${res.status}: ${await res.text()}` };
    }

    const data = (await res.json()) as {
      items?: Array<{ path: string; html_url: string; name: string }>;
      message?: string;
    };

    if (data.message) {
      return { error: data.message };
    }

    const items = (data.items ?? []).map((item) => ({
      path: item.path,
      name: item.name,
      url: item.html_url,
    }));

    return { totalCount: items.length, items };
  },
});

const readNotionTicketTool = tool({
  description:
    'Read a Notion ticket page to get its properties and content blocks. ' +
    'Returns the page title, description, status, and body text.',
  inputSchema: z.object({
    pageId: z.string().describe('The Notion page ID of the ticket'),
  }),
  execute: async ({ pageId }: { pageId: string }) => {
    try {
      const notion = getNotion();

      // Retrieve page properties
      const page = await notion.pages.retrieve({ page_id: pageId });

      // Retrieve page body blocks
      const blocksResponse = await notion.blocks.children.list({ block_id: pageId });

      // Extract text from blocks
      const bodyText = blocksResponse.results
        .map((block) => {
          const b = block as Record<string, unknown>;
          const type = b['type'] as string | undefined;
          if (!type) return '';
          const blockData = b[type] as Record<string, unknown> | undefined;
          if (!blockData) return '';
          const richText = blockData['rich_text'] as
            | Array<{ plain_text?: string }>
            | undefined;
          if (!richText) return '';
          return richText.map((rt) => rt.plain_text ?? '').join('');
        })
        .filter(Boolean)
        .join('\n');

      // Extract known properties from the page
      const props = (page as Record<string, unknown>)['properties'] as
        | Record<string, Record<string, unknown>>
        | undefined;

      const getTextProp = (key: string): string => {
        const prop = props?.[key];
        if (!prop) return '';
        const richText = prop['rich_text'] as
          | Array<{ plain_text?: string }>
          | undefined;
        if (richText) return richText.map((r) => r.plain_text ?? '').join('');
        const title = prop['title'] as Array<{ plain_text?: string }> | undefined;
        if (title) return title.map((r) => r.plain_text ?? '').join('');
        return '';
      };

      return {
        pageId,
        title: getTextProp('Title'),
        description: getTextProp('Description'),
        status:
          (props?.['Status']?.['select'] as { name?: string } | undefined)?.name ?? '',
        body: bodyText,
      };
    } catch (err) {
      return { error: String(err) };
    }
  },
});

const updateNotionTicketTool = tool({
  description:
    'Write investigation findings back to the Notion ticket and set its status to Triaged. ' +
    'Call this once you have identified the file, line number, root cause, and suggested fix.',
  inputSchema: z.object({
    pageId: z.string().describe('The Notion page ID of the ticket'),
    file: z.string().describe('Relative file path where the bug was found'),
    line: z.number().describe('Line number of the bug'),
    rootCause: z.string().describe('Explanation of the root cause'),
    suggestedFix: z
      .string()
      .describe('Code change or description of how to fix the bug'),
  }),
  execute: async ({
    pageId,
    file,
    line,
    rootCause,
    suggestedFix,
  }: {
    pageId: string;
    file: string;
    line: number;
    rootCause: string;
    suggestedFix: string;
  }) => {
    try {
      const findings = [
        `File: ${file}`,
        `Line: ${line}`,
        `Root Cause: ${rootCause}`,
        `Suggested Fix: ${suggestedFix}`,
      ].join('\n');

      await updateTicket({
        pageId,
        status: 'Triaged' as TicketStatus,
        findings,
      });

      return { ok: true, pageId, status: 'Triaged' };
    } catch (err) {
      return { error: String(err) };
    }
  },
});

// ---------------------------------------------------------------------------
// Agent runner
// ---------------------------------------------------------------------------

export async function runResearchAgent(input: AgentInput): Promise<AgentResult> {
  const repo = process.env.GITHUB_REPO ?? '(not configured)';

  const systemPrompt =
    `You are a bug research agent. Given a bug description from a Notion ticket, search the ` +
    `GitHub repository to find the exact file and line causing the issue. ` +
    `Write your findings (file path, line number, root cause, suggested fix) back to the ` +
    `Notion ticket. Then set the status to "Triaged".\n\n` +
    `The repository is: ${repo} (format: owner/repo)\n` +
    `Focus on TypeScript/JavaScript files in apps/web/lib/`;

  const { steps } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    prompt:
      `Investigate this bug ticket (Notion page ID: ${input.notionPageId}):\n\n` +
      `${input.bugDescription}\n\n` +
      `Search the codebase, find the root cause, and update the Notion ticket with your findings.`,
    tools: {
      read_github_file: readGithubFileTool,
      search_github_code: searchGithubCodeTool,
      read_notion_ticket: readNotionTicketTool,
      update_notion_ticket: updateNotionTicketTool,
    },
    stopWhen: stepCountIs(10),
  });

  // Extract the result from the update_notion_ticket tool call args.
  // This is more reliable than parsing free text.
  type UpdateArgs = { pageId: string; file: string; line: number; rootCause: string; suggestedFix: string };
  let updateArgs: UpdateArgs | undefined;
  for (const step of steps) {
    for (const call of step.toolCalls ?? []) {
      if (call.toolName === 'update_notion_ticket') {
        updateArgs = ('input' in call ? call.input : undefined) as UpdateArgs | undefined;
        break;
      }
    }
    if (updateArgs) break;
  }

  if (!updateArgs) {
    throw new Error(
      'Research agent did not call update_notion_ticket — agent may have failed to find the bug'
    );
  }

  return {
    file: updateArgs.file,
    line: updateArgs.line,
    description: updateArgs.rootCause,
    fix: updateArgs.suggestedFix,
    notionPageId: input.notionPageId,
  };
}
