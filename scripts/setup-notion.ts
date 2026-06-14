#!/usr/bin/env npx tsx
/**
 * One-time Notion setup script.
 * Run: NOTION_TOKEN=ntn_... npx tsx scripts/setup-notion.ts
 *
 * Creates the Bug Tickets database under the "SDLC Agent Harness" page
 * and prints the NOTION_DATABASE_ID for your .env.local.
 */

import { Client } from '@notionhq/client';

const token = process.env.NOTION_TOKEN;
if (!token) {
  console.error('Error: NOTION_TOKEN env var is required');
  process.exit(1);
}

const notion = new Client({ auth: token });

async function main() {
  // 1. Find the "SDLC Agent Harness" parent page
  console.log('Searching for "SDLC Agent Harness" page...');
  const search = await notion.search({
    query: 'SDLC Agent Harness',
    filter: { property: 'object', value: 'page' },
  });

  const parentPage = search.results[0];
  if (!parentPage || parentPage.object !== 'page') {
    console.error(
      'Could not find "SDLC Agent Harness" page. Make sure the integration has access to it.'
    );
    process.exit(1);
  }

  const parentPageId = parentPage.id;
  console.log(`Found parent page: ${parentPageId}`);

  // 2. Create the Bug Tickets database
  console.log('Creating Bug Tickets database...');
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: 'Bug Tickets' } }],
    icon: { type: 'emoji', emoji: '🐛' },
    properties: {
      Title: { title: {} },
      Status: {
        select: {
          options: [
            { name: 'Reported', color: 'red' },
            { name: 'Triaged', color: 'orange' },
            { name: 'To Do', color: 'yellow' },
            { name: 'In Progress', color: 'blue' },
            { name: 'In Review', color: 'purple' },
            { name: 'Done', color: 'green' },
          ],
        },
      },
      Description: { rich_text: {} },
      Transcript: { rich_text: {} },
      Reporter: { rich_text: {} },
      Findings: { rich_text: {} },
      TicketID: { rich_text: {} },
    },
  });

  const databaseId = db.id;

  console.log('\n✓ Bug Tickets database created!\n');
  console.log('Add this to your apps/web/.env.local:\n');
  console.log(`NOTION_DATABASE_ID=${databaseId}`);
  console.log(`\nOr open it in Notion: https://notion.so/${databaseId.replace(/-/g, '')}`);
}

main().catch((err) => {
  console.error('Failed:', err.message ?? err);
  process.exit(1);
});
