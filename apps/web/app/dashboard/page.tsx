import MetricCard from '@/components/dashboard/MetricCard';
import VoiceSupport from '@/components/voice/VoiceSupport';
import { getDashboardMetrics } from '@/lib/metrics';
import { auth0 } from '@/lib/auth0';

const ANIMATION_CLASSES = ['animate-card-1', 'animate-card-2', 'animate-card-3', 'animate-card-4'];

export default async function DashboardPage() {
  const metrics = getDashboardMetrics();
  const session = await auth0.getSession().catch(() => null);
  const userLabel = session?.user?.name ?? session?.user?.email ?? '';

  return (
    <>
      <div style={{ backgroundColor: '#0F0F13', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <header
          className="animate-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            height: '56px',
            borderBottom: '1px solid #1A1927',
            backgroundColor: '#0F0F13',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '24px', height: '24px', borderRadius: '5px',
                background: 'linear-gradient(135deg, #8B7CF8 0%, #6B5ED0 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1.5" y="1.5" width="4" height="4" rx="0.75" fill="white" />
                <rect x="6.5" y="1.5" width="4" height="4" rx="0.75" fill="white" opacity="0.5" />
                <rect x="1.5" y="6.5" width="4" height="4" rx="0.75" fill="white" opacity="0.5" />
                <rect x="6.5" y="6.5" width="4" height="4" rx="0.75" fill="white" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#E9E8EE',
                letterSpacing: '-0.01em',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Analytics
            </span>
          </div>

          {/* Right: user + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {userLabel && (
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: '#6C6A7C',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {userLabel}
              </span>
            )}
            <a href="/auth/logout" className="logout-link">Sign out</a>
          </div>
        </header>

        {/* Main */}
        <main style={{ flex: 1, padding: '2.5rem 2rem 2rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>

          {/* Page heading */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '2rem',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '1.25rem', fontWeight: 600, color: '#E9E8EE',
                  letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-sans)',
                }}
              >
                Overview
              </h1>
              <p
                style={{
                  fontSize: '0.8125rem', color: '#6C6A7C', margin: '0.25rem 0 0',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Business performance · Last 30 days
              </p>
            </div>

            {/* Period pill */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px', border: '1px solid #242331',
                backgroundColor: '#16151D',
                fontSize: '0.8125rem', color: '#6C6A7C',
                fontFamily: 'var(--font-sans)',
                userSelect: 'none',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M2 7H14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Jun 2026
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
                <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Metric cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            {metrics.map((metric, i) => (
              <MetricCard key={metric.id} metric={metric} animationClass={ANIMATION_CLASSES[i]} />
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#1A1927', marginBottom: '1.25rem' }} />

          {/* Bottom bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                className="live-dot"
                style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: '#4ADE80', display: 'inline-block', flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '0.8125rem', color: '#6C6A7C', fontFamily: 'var(--font-sans)' }}>
                Live
              </span>
            </div>
            <span style={{ fontSize: '0.8125rem', color: '#464456', fontFamily: 'var(--font-mono)' }}>
              Updated just now
            </span>
          </div>
        </main>

        {process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID && (
          <VoiceSupport agentId={process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID} />
        )}
      </div>
    </>
  );
}
