'use client';

import { useEffect, useRef, useState } from 'react';
import type { DashboardMetric } from '@/lib/metrics';

interface MetricCardProps {
  metric: DashboardMetric;
  animationClass: string;
}

function useCountUp(target: string, duration = 900) {
  const [displayed, setDisplayed] = useState('—');
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const numericMatch = target.match(/[\d.]+/);
    if (!numericMatch) { setDisplayed(target); return; }

    const endValue = parseFloat(numericMatch[0]);
    const prefix = target.startsWith('$') ? '$' : '';
    const suffix = target.endsWith('M') ? 'M'
      : target.endsWith('K') ? 'K'
      : target.endsWith('%') ? '%' : '';

    let start: number | null = null;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = endValue * eased;

      const formatted = suffix === 'M' ? `${prefix}${current.toFixed(2)}M`
        : suffix === 'K' ? `${prefix}${current.toFixed(1)}K`
        : suffix === '%' ? `${current.toFixed(2)}%`
        : `${prefix}${Math.round(current).toLocaleString()}`;

      setDisplayed(formatted);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setDisplayed(target);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return displayed;
}

export default function MetricCard({ metric, animationClass }: MetricCardProps) {
  const displayed = useCountUp(metric.value);
  const isUp = metric.trend > 0;
  const trendColor = isUp ? '#4ADE80' : '#F87171';
  const trendBg   = isUp ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)';

  return (
    <div
      className={animationClass}
      style={{
        backgroundColor: '#16151D',
        border: '1px solid #242331',
        borderRadius: '10px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        transition: 'border-color 0.15s, background-color 0.15s, transform 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = '#343140';
        el.style.backgroundColor = '#1C1B26';
        el.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = '#242331';
        el.style.backgroundColor = '#16151D';
        el.style.transform = 'translateY(0)';
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 500,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: '#6C6A7C',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {metric.label}
      </span>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(2.25rem, 4vw, 3rem)',
            fontWeight: 300,
            letterSpacing: '-0.03em',
            color: '#E9E8EE',
            lineHeight: 1,
          }}
        >
          {displayed}
        </span>
        {metric.unit && metric.unit !== '%' && (
          <span style={{ fontSize: '0.75rem', color: '#464456', fontFamily: 'var(--font-sans)' }}>
            {metric.unit}
          </span>
        )}
      </div>

      {/* Trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            color: trendColor,
            backgroundColor: trendBg,
            borderRadius: '4px',
            padding: '0.125rem 0.4rem',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            {isUp ? (
              <path d="M2 7L5 3L8 7" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M2 3L5 7L8 3" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          {isUp ? '+' : ''}{metric.trend.toFixed(1)}%
        </span>
        <span style={{ fontSize: '0.75rem', color: '#6C6A7C', fontFamily: 'var(--font-sans)' }}>
          {metric.trendLabel}
        </span>
      </div>
    </div>
  );
}
