import { getNotion, getNotionDatabaseId } from './client';

type UpdatePageProperties = NonNullable<Parameters<ReturnType<typeof getNotion>['pages']['update']>[0]['properties']>;

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
}

export interface UpdateTicketInput {
  pageId: string;
  status?: TicketStatus;
  findings?: string;
}

export async function createBugTicket(input: CreateTicketInput): Promise<string> {
  const notion = getNotion();
  const response = await notion.pages.create({
    parent: { database_id: getNotionDatabaseId() },
    properties: {
      Title: {
        title: [{ text: { content: input.title } }],
      },
      Status: {
        select: { name: 'Reported' },
      },
      Description: {
        rich_text: [{ text: { content: input.description } }],
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
