// app/developer/page.tsx
import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { getRolesFromClaim, ROLES } from '@/lib/auth/config';
import { getNotion, getNotionDatabaseId } from '@/lib/notion/client';
import TicketList from '@/components/developer/TicketList';
import type { TicketSummary } from '@/components/developer/TicketList';

async function fetchTickets(): Promise<TicketSummary[]> {
  const notion = getNotion();
  const response = await notion.dataSources.query({
    data_source_id: getNotionDatabaseId(),
    sorts: [{ property: 'Created', direction: 'descending' }],
  });

  return response.results.map(page => {
    const props = (page as { properties: Record<string, unknown> }).properties;

    const getTitle = (p: unknown) => {
      const prop = p as { title?: Array<{ plain_text: string }> };
      return prop?.title?.[0]?.plain_text ?? '';
    };

    const getRichText = (p: unknown) => {
      const prop = p as { rich_text?: Array<{ plain_text: string }> };
      return prop?.rich_text?.[0]?.plain_text ?? '';
    };

    const getSelect = (p: unknown) => {
      const prop = p as { select?: { name: string } };
      return prop?.select?.name ?? '';
    };

    return {
      id: (page as { id: string }).id,
      ticketId: getRichText(props['TicketID']),
      title: getTitle(props['Title']),
      status: getSelect(props['Status']),
      description: getRichText(props['Description']),
    };
  });
}

export default async function DeveloperPage() {
  const session = await auth0.getSession().catch(() => null);

  if (!session) redirect('/auth/login?returnTo=/developer');

  const roles = getRolesFromClaim(session.user as Record<string, unknown>);
  if (!roles.includes(ROLES.DEVELOPER)) redirect('/dashboard');

  // Fetch tickets from Notion
  let tickets: TicketSummary[] = [];
  try {
    tickets = await fetchTickets();
  } catch {
    // Notion not configured — show empty state
  }

  return (
    <main
      style={{ backgroundColor: '#060a12', color: '#d9e4f0', minHeight: '100vh', padding: '2rem' }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: '3rem',
          letterSpacing: '0.15em',
          color: '#00c96e',
          marginBottom: '2rem',
        }}
      >
        DEVELOPER CONSOLE
      </h1>
      <TicketList tickets={tickets} />
    </main>
  );
}
