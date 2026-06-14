'use client';

import { useConversation } from '@11labs/react';
import { useCallback } from 'react';
import { Orb, type AgentState } from '@/components/ui/orb';

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

  // Map SDK status → Orb agentState
  const agentState: AgentState = isConnecting
    ? 'thinking'
    : isConnected
      ? conversation.isSpeaking
        ? 'talking'
        : 'listening'
      : null;

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

  return (
    <button
      onClick={handleClick}
      disabled={!agentId || isConnecting}
      aria-label={isConnected ? 'End voice conversation' : 'Start voice conversation'}
      aria-pressed={isConnected}
      title={isConnected ? 'Click to end call' : 'Talk to support'}
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 50,
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        border: 'none',
        padding: 0,
        background: 'transparent',
        cursor: !agentId || isConnecting ? 'not-allowed' : 'pointer',
        overflow: 'hidden',
      }}
    >
      <Orb
        agentState={agentState}
        // App purple palette: darker + lighter tone
        colors={['#8B7CF8', '#C4BCFF']}
        seed={42}
        volumeMode="auto"
        className="h-full w-full"
      />
    </button>
  );
}
