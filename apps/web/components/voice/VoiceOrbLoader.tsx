'use client';

// @11labs/react accesses WebRTC/WebAudio at import time.
// ssr: false must live in a Client Component — Server Components cannot opt out of SSR.
import dynamic from 'next/dynamic';

const VoiceOrb = dynamic(() => import('./CallSupportButton'), { ssr: false });

export default function VoiceOrbLoader({ agentId }: { agentId?: string }) {
  return <VoiceOrb agentId={agentId} />;
}
