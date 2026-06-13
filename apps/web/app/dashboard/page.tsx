import Script from 'next/script';
import MetricCard from '@/components/dashboard/MetricCard';
import CallSupportButton from '@/components/voice/CallSupportButton';
import { getDashboardMetrics } from '@/lib/metrics';

const ANIMATION_CLASSES = [
  'animate-card-1',
  'animate-card-2',
  'animate-card-3',
  'animate-card-4',
];

export default function DashboardPage() {
  const metrics = getDashboardMetrics();

  return (
    <>
      {/* ElevenLabs Conversational AI widget script */}
      <Script
        src="https://elevenlabs.io/convai-widget/index.js"
        strategy="lazyOnload"
      />

      <main
        className="grid-texture relative flex min-h-screen flex-col"
        style={{ backgroundColor: '#060a12' }}
      >
        {/* Top accent line */}
        <div
          className="h-px w-full"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(0, 201, 110, 0.6) 30%, rgba(0, 201, 110, 0.6) 70%, transparent 100%)',
          }}
        />

        {/* Header */}
        <header
          className="animate-header flex items-center justify-between border-b px-8 py-5"
          style={{ borderColor: '#1a2d50' }}
        >
          <div className="flex items-center gap-4">
            {/* Logo mark */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-sm"
              style={{ backgroundColor: '#00c96e', color: '#060a12' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" fill="currentColor" />
                <rect x="9" y="2" width="5" height="5" fill="currentColor" opacity="0.5" />
                <rect x="2" y="9" width="5" height="5" fill="currentColor" opacity="0.5" />
                <rect x="9" y="9" width="5" height="5" fill="currentColor" />
              </svg>
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: '1.5rem',
                  color: '#d9e4f0',
                  letterSpacing: '0.15em',
                  lineHeight: 1,
                }}
              >
                MISSION CONTROL
              </div>
              <div
                className="text-xs tracking-widest"
                style={{ color: '#4a6484', fontFamily: 'var(--font-ibm-mono)' }}
              >
                ANALYTICS DASHBOARD — LIVE
              </div>
            </div>
          </div>

          {/* Right side: status + date */}
          <div className="flex items-center gap-6">
            {/* System status */}
            <div className="flex items-center gap-2">
              <span
                className="badge-blink h-2 w-2 rounded-full"
                style={{ backgroundColor: '#ff3535' }}
              />
              <span
                className="text-xs font-semibold tracking-widest"
                style={{ color: '#ff3535', fontFamily: 'var(--font-ibm-mono)' }}
              >
                1 ANOMALY
              </span>
            </div>

            <div
              className="h-4 w-px"
              style={{ backgroundColor: '#1a2d50' }}
            />

            {/* Separator */}
            <div className="text-right">
              <div
                className="text-xs tracking-widest"
                style={{ color: '#4a6484', fontFamily: 'var(--font-ibm-mono)' }}
              >
                SYS/REV 4.2.1
              </div>
              <div
                className="text-xs tracking-widest"
                style={{ color: '#263347', fontFamily: 'var(--font-ibm-mono)' }}
              >
                JUNE 2026
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex flex-1 flex-col gap-8 px-8 py-8">
          {/* Section label */}
          <div className="flex items-center gap-4">
            <div
              className="h-px flex-1"
              style={{ backgroundColor: '#1a2d50' }}
            />
            <span
              className="text-xs tracking-[0.3em]"
              style={{ color: '#263347', fontFamily: 'var(--font-ibm-mono)' }}
            >
              CORE METRICS
            </span>
            <div
              className="h-px flex-1"
              style={{ backgroundColor: '#1a2d50' }}
            />
          </div>

          {/* Metric cards grid */}
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, i) => (
              <MetricCard
                key={metric.id}
                metric={metric}
                animationClass={ANIMATION_CLASSES[i]}
              />
            ))}
          </div>

          {/* Bottom status bar */}
          <div
            className="flex items-center justify-between rounded-lg border px-5 py-3"
            style={{
              borderColor: '#1a2d50',
              backgroundColor: '#0b1422',
              fontFamily: 'var(--font-ibm-mono)',
            }}
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span
                  className="status-dot h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: '#00c96e' }}
                />
                <span className="text-xs tracking-widest" style={{ color: '#4a6484' }}>
                  DATA STREAM ACTIVE
                </span>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-xs tracking-widest" style={{ color: '#263347' }}>
                  LAST SYNC: 00:00:12 AGO
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Incident notice */}
              <div
                className="hidden items-center gap-2 rounded-md border px-3 py-1.5 text-xs sm:flex"
                style={{
                  borderColor: 'rgba(255, 53, 53, 0.3)',
                  backgroundColor: 'rgba(255, 53, 53, 0.05)',
                  color: 'rgba(255, 53, 53, 0.8)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1L11 10H1L6 1Z" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M6 4.5V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
                </svg>
                CONVERSION RATE METRIC REQUIRES ATTENTION
              </div>

              <CallSupportButton agentId={process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID} />
            </div>
          </div>
        </div>

        {/* Corner decorations */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-16 w-16"
          style={{
            borderTop: '1px solid rgba(0, 201, 110, 0.3)',
            borderLeft: '1px solid rgba(0, 201, 110, 0.3)',
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-0 h-16 w-16"
          style={{
            borderTop: '1px solid rgba(0, 201, 110, 0.3)',
            borderRight: '1px solid rgba(0, 201, 110, 0.3)',
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-16 w-16"
          style={{
            borderBottom: '1px solid rgba(0, 201, 110, 0.3)',
            borderLeft: '1px solid rgba(0, 201, 110, 0.3)',
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-16 w-16"
          style={{
            borderBottom: '1px solid rgba(0, 201, 110, 0.3)',
            borderRight: '1px solid rgba(0, 201, 110, 0.3)',
          }}
        />
      </main>
    </>
  );
}
