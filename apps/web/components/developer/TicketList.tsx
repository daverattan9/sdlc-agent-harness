'use client';

import { useState } from 'react';

export interface TicketSummary {
  id: string; // Notion page ID
  ticketId: string; // TICKET-xxx
  title: string;
  status: string;
  description: string;
}

const STATUS_COLORS: Record<string, string> = {
  Reported: '#f59e0b',
  Triaged: '#3b82f6',
  'In Progress': '#8b5cf6',
  'In Review': '#00c96e',
  Done: '#4a6484',
};

export default function TicketList({ tickets }: { tickets: TicketSummary[] }) {
  const [investigating, setInvestigating] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  async function handleInvestigate(ticket: TicketSummary) {
    setInvestigating(ticket.id);
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notionPageId: ticket.id,
          bugDescription: ticket.description,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResults(prev => ({ ...prev, [ticket.id]: JSON.stringify(data.result, null, 2) }));
      } else {
        setResults(prev => ({ ...prev, [ticket.id]: `Error: ${data.error}` }));
      }
    } catch (err) {
      setResults(prev => ({ ...prev, [ticket.id]: `Network error: ${String(err)}` }));
    } finally {
      setInvestigating(null);
    }
  }

  if (tickets.length === 0) {
    return (
      <div
        style={{
          color: '#4a6484',
          fontFamily: 'var(--font-ibm-mono)',
          padding: '2rem',
          border: '1px solid #1a2d50',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        No tickets found. Notion may not be configured yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {tickets.map(ticket => (
        <div
          key={ticket.id}
          style={{
            border: '1px solid #1a2d50',
            borderRadius: '8px',
            padding: '1.5rem',
            backgroundColor: '#0b1422',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-ibm-mono)',
                  fontSize: '0.75rem',
                  color: '#4a6484',
                  marginBottom: '0.25rem',
                }}
              >
                {ticket.ticketId}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: '1.5rem',
                  letterSpacing: '0.05em',
                  color: '#d9e4f0',
                }}
              >
                {ticket.title}
              </div>
            </div>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-ibm-mono)',
                border: `1px solid ${STATUS_COLORS[ticket.status] ?? '#4a6484'}`,
                color: STATUS_COLORS[ticket.status] ?? '#4a6484',
                whiteSpace: 'nowrap',
              }}
            >
              {ticket.status}
            </span>
          </div>

          {ticket.description && (
            <div
              style={{
                marginTop: '0.75rem',
                color: '#4a6484',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-ibm-mono)',
              }}
            >
              {ticket.description.slice(0, 150)}
              {ticket.description.length > 150 ? '\u2026' : ''}
            </div>
          )}

          {(ticket.status === 'Reported' || ticket.status === 'Triaged') && (
            <button
              onClick={() => handleInvestigate(ticket)}
              disabled={investigating === ticket.id}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                border: '1px solid rgba(0, 201, 110, 0.4)',
                backgroundColor: 'rgba(0, 201, 110, 0.1)',
                color: '#00c96e',
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                cursor: investigating ? 'not-allowed' : 'pointer',
                opacity: investigating === ticket.id ? 0.6 : 1,
              }}
            >
              {investigating === ticket.id ? 'INVESTIGATING...' : 'INVESTIGATE WITH CLAUDE'}
            </button>
          )}

          {results[ticket.id] && (
            <pre
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#060a12',
                border: '1px solid #1a2d50',
                borderRadius: '6px',
                color: '#00c96e',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-ibm-mono)',
                overflow: 'auto',
                maxHeight: '200px',
              }}
            >
              {results[ticket.id]}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
