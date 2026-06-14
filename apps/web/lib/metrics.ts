export interface MetricSnapshot {
  monthlyRevenue: number;
  activeUsers: number;
  totalSessions: number;
  purchases: number;
}

export const CURRENT_METRICS: MetricSnapshot = {
  monthlyRevenue: 2_847_320,
  activeUsers: 142_847,
  totalSessions: 891_234,
  purchases: 12_847,
};

/**
 * Calculates conversion rate as a percentage.
 *
 * BUG (planted): Math.floor() is applied BEFORE multiplication, causing
 * integer truncation. Because purchases/sessions < 1, Math.floor returns 0,
 * and the result is always 0.00%.
 *
 * Fix: return (conversions / sessions) * 100;
 */
export function calculateConversionRate(conversions: number, sessions: number): number {
  if (sessions <= 0) return 0;
  // BUG: floor before multiply truncates the decimal to 0
  return Math.floor(conversions / sessions) * 100;
}

export function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  unit: string;
  trend: number;
  trendLabel: string;
  isBuggy: boolean;
}

export function getDashboardMetrics(): DashboardMetric[] {
  const { monthlyRevenue, activeUsers, totalSessions, purchases } = CURRENT_METRICS;
  const conversionRate = calculateConversionRate(purchases, totalSessions);

  return [
    {
      id: 'revenue',
      label: 'MONTHLY REVENUE',
      value: formatRevenue(monthlyRevenue),
      rawValue: monthlyRevenue,
      unit: 'USD',
      trend: 12.4,
      trendLabel: 'vs last month',
      isBuggy: false,
    },
    {
      id: 'users',
      label: 'ACTIVE USERS',
      value: formatCount(activeUsers),
      rawValue: activeUsers,
      unit: 'users',
      trend: 8.7,
      trendLabel: 'vs last month',
      isBuggy: false,
    },
    {
      id: 'sessions',
      label: 'TOTAL SESSIONS',
      value: formatCount(totalSessions),
      rawValue: totalSessions,
      unit: 'sessions',
      trend: 5.2,
      trendLabel: 'vs last month',
      isBuggy: false,
    },
    {
      id: 'conversion',
      label: 'CONVERSION RATE',
      value: `${conversionRate.toFixed(2)}%`,
      rawValue: conversionRate,
      unit: '%',
      trend: -99.9,
      trendLabel: 'vs last month',
      isBuggy: true,
    },
  ];
}
