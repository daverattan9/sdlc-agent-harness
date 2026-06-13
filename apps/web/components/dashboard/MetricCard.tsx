'use client';

import { useEffect, useRef, useState } from 'react';
import type { DashboardMetric } from '@/lib/metrics';

interface MetricCardProps {
  metric: DashboardMetric;
  animationClass: string;
}

function useCountUp(target: string, isBuggy: boolean, duration = 1200) {
  const [displayed, setDisplayed] = useState('—');
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isBuggy) {
      // For the buggy metric: count up to a "normal" looking value then
      // snap to 0.00% to dramatise the fault
      let start: number | null = null;
      const FAKE_TARGET = 14.4;

      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / (duration * 0.7), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayed(`${(FAKE_TARGET * eased).toFixed(2)}%`);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(step);
        } else {
          // Snap to the buggy 0.00%
          setTimeout(() => setDisplayed(target), 80);
        }
      };

      frameRef.current = requestAnimationFrame(step);
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    }

    // Normal counter: parse target string to get numeric end value
    const numericMatch = target.match(/[\d.]+/);
    if (!numericMatch) {
      setDisplayed(target);
      return;
    }
    const endValue = parseFloat(numericMatch[0]);
    const prefix = target.startsWith('$') ? '$' : '';
    const suffix = target.endsWith('M')
      ? 'M'
      : target.endsWith('K')
        ? 'K'
        : target.endsWith('%')
          ? '%'
          : '';

    let start: number | null = null;

    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = endValue * eased;

      const formatted =
        suffix === 'M'
          ? `${prefix}${current.toFixed(2)}${suffix}`
          : suffix === 'K'
            ? `${prefix}${current.toFixed(1)}${suffix}`
            : suffix === '%'
              ? `${current.toFixed(2)}${suffix}`
              : `${prefix}${Math.round(current).toLocaleString()}`;

      setDisplayed(formatted);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setDisplayed(target);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, isBuggy, duration]);

  return displayed;
}

export default function MetricCard({ metric, animationClass }: MetricCardProps) {
  const displayed = useCountUp(metric.value, metric.isBuggy);
  const isPositive = metric.trend > 0;

  if (metric.isBuggy) {
    return (
      <div className={`relative flex flex-col p-7 ${animationClass}`}>
        {/* Buggy card: pulsing red border */}
        <div
          className="pulse-red scanlines absolute inset-0 rounded-xl border-2 bg-red-950/20"
          style={{ borderColor: 'rgba(255, 53, 53, 0.5)' }}
        />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold tracking-[0.2em]"
              style={{ color: '#ff3535', fontFamily: 'var(--font-ibm-mono)' }}
            >
              {metric.label}
            </span>

            {/* Anomaly badge */}
            <span
              className="badge-blink inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              style={{
                borderColor: 'rgba(255, 53, 53, 0.6)',
                color: '#ff3535',
                backgroundColor: 'rgba(255, 53, 53, 0.1)',
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: '#ff3535' }}
              />
              ANOMALY DETECTED
            </span>
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-3">
            <span
              className="text-glow-red leading-none"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(4rem, 8vw, 7rem)',
                color: '#ff3535',
                letterSpacing: '0.02em',
              }}
            >
              {displayed}
            </span>
          </div>

          {/* Expected value hint */}
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: 'rgba(255, 53, 53, 0.7)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1L7 8M7 11L7 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>Expected ~14.39% — reporting as {metric.value}</span>
          </div>

          {/* Separator */}
          <div
            className="h-px w-full"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,53,53,0.4) 0%, rgba(255,53,53,0.05) 100%)',
            }}
          />

          {/* Trend */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: 'rgba(255, 53, 53, 0.6)' }}
            >
              {metric.trend.toFixed(1)}% {metric.trendLabel}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col p-7 ${animationClass}`}>
      {/* Healthy card: subtle green border */}
      <div
        className="glow-green absolute inset-0 rounded-xl border"
        style={{
          borderColor: 'rgba(0, 201, 110, 0.2)',
          backgroundColor: '#0e1929',
        }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-semibold tracking-[0.2em]"
            style={{ color: '#4a6484', fontFamily: 'var(--font-ibm-mono)' }}
          >
            {metric.label}
          </span>

          {/* Status dot */}
          <span className="flex items-center gap-1.5">
            <span
              className="status-dot inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: '#00c96e' }}
            />
            <span className="text-xs tracking-widest" style={{ color: '#4a6484' }}>
              NOMINAL
            </span>
          </span>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-3">
          <span
            className="text-glow-green leading-none"
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(4rem, 8vw, 7rem)',
              color: '#00c96e',
              letterSpacing: '0.02em',
            }}
          >
            {displayed}
          </span>
          <span className="text-xs uppercase tracking-widest" style={{ color: '#263347' }}>
            {metric.unit}
          </span>
        </div>

        {/* Separator */}
        <div
          className="h-px w-full"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,201,110,0.2) 0%, rgba(0,201,110,0.02) 100%)',
          }}
        />

        {/* Trend */}
        <div className="flex items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ color: isPositive ? '#00c96e' : '#ff3535' }}
          >
            {isPositive ? (
              <path
                d="M2 8L6 4L10 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
          <span
            className="text-xs"
            style={{ color: isPositive ? 'rgba(0, 201, 110, 0.7)' : 'rgba(255, 53, 53, 0.7)' }}
          >
            {isPositive ? '+' : ''}
            {metric.trend.toFixed(1)}% {metric.trendLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
