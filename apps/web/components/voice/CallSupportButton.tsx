'use client';

import { useState } from 'react';

interface CallSupportButtonProps {
  agentId?: string;
}

export default function CallSupportButton({ agentId }: CallSupportButtonProps) {
  const [isActive, setIsActive] = useState(false);

  const handleCall = () => {
    if (typeof window === 'undefined') return;
    const widget = document.querySelector('elevenlabs-convai') as HTMLElement & {
      startSession?: () => void;
    };
    if (widget?.startSession) {
      widget.startSession();
      setIsActive(true);
    } else {
      setIsActive(prev => !prev);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
      {agentId && (
        <div style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
          {/* @ts-expect-error elevenlabs-convai is a custom element */}
          <elevenlabs-convai agent-id={agentId} />
        </div>
      )}

      <button
        onClick={handleCall}
        aria-pressed={isActive}
        aria-label={isActive ? 'End support call' : 'Talk to support'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.875rem',
          borderRadius: '7px',
          border: `1px solid ${isActive ? 'rgba(139,124,248,0.5)' : '#242331'}`,
          backgroundColor: isActive ? 'rgba(139,124,248,0.1)' : 'transparent',
          color: isActive ? '#8B7CF8' : '#6C6A7C',
          fontSize: '0.8125rem',
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#343140';
            (e.currentTarget as HTMLButtonElement).style.color = '#E9E8EE';
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#242331';
            (e.currentTarget as HTMLButtonElement).style.color = '#6C6A7C';
          }
        }}
      >
        {isActive ? (
          <>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              backgroundColor: '#8B7CF8', animation: 'live-pulse 1.2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            In call
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path
                d="M3.5 2C3.5 2 2 2 2 3.5C2 9 7 14 12.5 14C14 14 14 12.5 14 12.5L12.5 10.5C12.5 10.5 11.5 10 11 10.5L9.5 12C8 11.5 5 8.5 4.5 7L6 5.5C6.5 5 6 4 6 4L3.5 2Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            Talk to support
          </>
        )}
      </button>
    </div>
  );
}
