import { Client } from '@notionhq/client';

let _notion: Client | null = null;

/**
 * Returns the Notion client singleton.
 * Throws at request time (not build time) if NOTION_API_KEY is missing.
 */
export function getNotion(): Client {
  if (!_notion) {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY environment variable is required');
    }
    _notion = new Client({ auth: process.env.NOTION_API_KEY });
  }
  return _notion;
}

export function getNotionDatabaseId(): string {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) throw new Error('NOTION_DATABASE_ID environment variable is required');
  return id;
}
