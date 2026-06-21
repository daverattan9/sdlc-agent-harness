import { getNotion, getNotionDatabaseId } from './client';

type UpdatePageProperties = NonNullable<Parameters<ReturnType<typeof getNotion>['pages']['update']>[0]['properties']>;
type CreatePageChildren = NonNullable<Parameters<ReturnType<typeof getNotion>['pages']['create']>[0]['children']>;

export type TicketStatus =
  | 'Reported'
  | 'Triaged'
  | 'To Do'
  | 'In Progress'
  | 'In Review'
  | 'Done';

export interface CreateTicketInput {
  title: string;
  description: string;
  transcript: string;
  reporterId: string;
  ticketId: string;
  stepsToReproduce?: string;
  severity?: string;
  affectedArea?: string;
}

export interface UpdateTicketInput {
  pageId: string;
  status?: TicketStatus;
  findings?: string;
}

/** Split text into 2000-char chunks (Notion rich_text limit). */
function splitText(text: string, limit = 2000): Array<{ text: { content: string } }> {
  const chunks: Array<{ text: { content: string } }> = [];
  for (let i = 0; i < text.length; i += limit) {
    chunks.push({ text: { content: text.slice(i, i + limit) } });
  }
  return chunks.length > 0 ? chunks : [{ text: { content: '' } }];
}

export async function createBugTicket(input: CreateTicketInput): Promise<string> {
  const notion = getNotion();

  // Build structured page body blocks
  const children: CreatePageChildren = [];

  // Bug Description section
  children.push(
    { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Bug Description' } }] } },
    { object: 'block', type: 'paragraph', paragraph: { rich_text: splitText(input.description) } },
  );

  // Steps to Reproduce (if provided)
  if (input.stepsToReproduce) {
    children.push(
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Steps to Reproduce' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: splitText(input.stepsToReproduce) } },
    );
  }

  // Severity (if provided)
  if (input.severity) {
    children.push(
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Severity' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: input.severity } }] } },
    );
  }

  // Affected Area (if provided)
  if (input.affectedArea) {
    children.push(
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Affected Area' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: input.affectedArea } }] } },
    );
  }

  // Conversation Transcript
  if (input.transcript) {
    children.push(
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Conversation Transcript' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: splitText(input.transcript) } },
    );
  }

  // Divider at the bottom
  children.push({ object: 'block', type: 'divider', divider: {} });

  const response = await notion.pages.create({
    parent: { database_id: getNotionDatabaseId() },
    properties: {
      Name: {
        title: [{ text: { content: input.title } }],
      },
      Status: {
        select: { name: 'Reported' },
      },
      Description: {
        rich_text: [{ text: { content: input.description.slice(0, 2000) } }],
      },
      Transcript: {
        rich_text: [{ text: { content: input.transcript.slice(0, 2000) } }],
      },
      Reporter: {
        rich_text: [{ text: { content: input.reporterId } }],
      },
      TicketID: {
        rich_text: [{ text: { content: input.ticketId } }],
      },
    },
    children,
  });
  return response.id;
}

export async function updateTicket(input: UpdateTicketInput): Promise<void> {
  const notion = getNotion();
  const properties: UpdatePageProperties = {};

  if (input.status) {
    properties['Status'] = { select: { name: input.status } };
  }

  if (input.findings) {
    properties['Findings'] = {
      rich_text: [{ text: { content: input.findings.slice(0, 2000) } }],
    };
  }

  await notion.pages.update({
    page_id: input.pageId,
    properties,
  });
}

export async function getTicketByPageId(pageId: string) {
  return getNotion().pages.retrieve({ page_id: pageId });
}
