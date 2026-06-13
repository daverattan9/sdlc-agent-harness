'use client';

import { useState } from 'react';

interface CallSupportButtonProps {
  agentId?: string;
}

export default function CallSupportButton({ agentId }: CallSupportButtonProps) {
  const [isActive, setIsActive] = useState(false);

  const handleCall = () => {
    if (typeof window === 'undefined') return;

    // ElevenLabs Conversational AI widget triggers the call
    // The widget is loaded via the script tag in the page
    const widget = document.querySelector('elevenlabs-convai') as HTMLElement & {
      startSession?: () => void;
    };

    if (widget?.startSession) {
      widget.startSession();
      setIsActive(true);
    } else {
      // Fallback: toggle visibility of the widget
      setIsActive((prev) => !prev);
    }
  };

  return (
    <div className="flex flex-col items-end gap-3">
      {/* ElevenLabs widget — hidden by default, triggered on button click */}
      {agentId && (
        <div
          className="transition-all duration-300"
          style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none' }}
        >
          {/* @ts-expect-error elevenlabs-convai is a custom element */}
          <elevenlabs-convai agent-id={agentId} />
        </div>
      )}

      <button
        onClick={handleCall}
        className="group relative flex items-center gap-3 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 active:scale-95"
        style={{
          backgroundColor: isActive ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${isActive ? 'rgba(245, 158, 11, 0.8)' : 'rgba(245, 158, 11, 0.4)'}`,
          color: '#f59e0b',
          fontFamily: 'var(--font-ibm-mono)',
          letterSpacing: '0.12em',
        }}
      >
        {/* Shimmer effect */}
        <span
          className="absolute inset-0 -translate-x-full transition-transform duration-700 group-hover:translate-x-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.15), transparent)',
          }}
        />

        {/* Call icon */}
        <span className="relative flex h-4 w-4 items-center justify-center">
          {isActive ? (
            // Active: pulsing indicator
            <span className="relative">
              <span
                className="absolute -inset-1 animate-ping rounded-full opacity-75"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.4)' }}
              />
              <span
                className="relative inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: '#f59e0b' }}
              />
            </span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3.5 2C3.5 2 2 2 2 3.5C2 9 7 14 12.5 14C14 14 14 12.5 14 12.5L12.5 10.5C12.5 10.5 11.5 10 11 10.5L9.5 12C8 11.5 5 8.5 4.5 7L6 5.5C6.5 5 6 4 6 4L3.5 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>

        <span className="relative">{isActive ? 'IN CALL...' : 'CALL SUPPORT'}</span>
      </button>
    </div>
  );
}
