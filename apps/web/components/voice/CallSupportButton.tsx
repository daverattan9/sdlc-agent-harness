'use client';

import { useConversation } from '@11labs/react';
import { useCallback } from 'react';

interface VoiceOrbProps {
  agentId?: string;
}

export default function VoiceOrb({ agentId }: VoiceOrbProps) {
  const conversation = useConversation({
    onConnect: () => console.log('[ElevenLabs] Connected'),
    onDisconnect: () => console.log('[ElevenLabs] Disconnected'),
    onError: (error) => console.error('[ElevenLabs] Error:', error),
  });

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';
  const isSpeaking = conversation.isSpeaking;

  const handleClick = useCallback(async () => {
    if (!agentId) return;
    if (isConnected) {
      await conversation.endSession();
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ agentId });
    } catch (error) {
      console.error('[ElevenLabs] Failed to start conversation:', error);
    }
  }, [agentId, conversation, isConnected]);

  // Colour + animation vary by state
  const orbColor = isSpeaking ? '#4ADE80' : isConnected ? '#8B7CF8' : '#6B5ED0';
  const ringColor = isSpeaking ? 'rgba(74,222,128,' : 'rgba(139,124,248,';
  const isAnimating = isConnected || isConnecting;

  return (
    <>
      {/* Keyframes injected inline — keeps the component self-contained */}
      <style>{`
        @keyframes orb-ring {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes orb-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Pulse rings — only rendered when active */}
        {isAnimating && (
          <>
            <span style={{
              position: 'absolute',
              width: '56px', height: '56px',
              borderRadius: '50%',
              backgroundColor: `${ringColor}0.25)`,
              animation: 'orb-ring 1.6s ease-out infinite',
            }} />
            <span style={{
              position: 'absolute',
              width: '56px', height: '56px',
              borderRadius: '50%',
              backgroundColor: `${ringColor}0.15)`,
              animation: 'orb-ring 1.6s ease-out infinite 0.5s',
            }} />
          </>
        )}

        <button
          onClick={handleClick}
          disabled={!agentId || isConnecting}
          aria-label={isConnected ? 'End voice conversation' : 'Start voice conversation with support'}
          aria-pressed={isConnected}
          title={isConnected ? 'Click to end call' : 'Talk to support'}
          style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            cursor: !agentId || isConnecting ? 'not-allowed' : 'pointer',
            background: isAnimating
              ? `radial-gradient(circle at 35% 35%, ${orbColor}, ${orbColor}CC)`
              : 'radial-gradient(circle at 35% 35%, #8B7CF8, #5B4FD0)',
            boxShadow: isAnimating
              ? `0 0 0 2px ${ringColor}0.4), 0 4px 20px ${ringColor}0.35)`
              : '0 4px 16px rgba(107,94,208,0.4)',
            transition: 'background 0.3s, box-shadow 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isConnecting ? (
            /* Spinner while connecting */
            <svg
              width="22" height="22" viewBox="0 0 24 24" fill="none"
              style={{ animation: 'orb-spin 0.9s linear infinite' }}
            >
              <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
              <path d="M12 3a9 9 0 0 1 9 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : isConnected ? (
            /* Waveform bars when in call */
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3"  y="9"  width="3" height="6"  rx="1.5" fill="white" opacity={isSpeaking ? '1' : '0.5'} />
              <rect x="8"  y="5"  width="3" height="14" rx="1.5" fill="white" />
              <rect x="13" y="7"  width="3" height="10" rx="1.5" fill="white" opacity={isSpeaking ? '0.8' : '0.5'} />
              <rect x="18" y="10" width="3" height="5"  rx="1.5" fill="white" opacity="0.4" />
            </svg>
          ) : (
            /* Microphone icon when idle */
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
              <path
                d="M5 10a7 7 0 0 0 14 0"
                stroke="white" strokeWidth="2" strokeLinecap="round"
              />
              <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="9"  y1="22" x2="15" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
