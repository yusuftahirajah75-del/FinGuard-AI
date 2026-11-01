/**
 * Formatting and styling helper utilities for FTADS
 */

export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(d) + ' UTC';
  } catch {
    return String(isoString);
  }
}

export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);

    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '—';
  }
}

export function formatScore(score) {
  if (score === null || score === undefined || isNaN(score)) return '—';
  return Number(score).toFixed(1);
}

export function getRiskLevelConfig(riskLevel) {
  const level = String(riskLevel || '').toUpperCase();
  switch (level) {
    case 'CRITICAL':
      return {
        label: 'CRITICAL',
        color: '#ef4444',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
        dotClass: 'bg-rose-600',
        borderClass: 'border-rose-500',
        bgSubtle: 'bg-rose-50/50',
      };
    case 'HIGH':
      return {
        label: 'HIGH',
        color: '#f97316',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20',
        dotClass: 'bg-orange-500',
        borderClass: 'border-orange-500',
        bgSubtle: 'bg-orange-50/50',
      };
    case 'MEDIUM':
      return {
        label: 'MEDIUM',
        color: '#f59e0b',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
        dotClass: 'bg-amber-500',
        borderClass: 'border-amber-500',
        bgSubtle: 'bg-amber-50/50',
      };
    case 'LOW':
    default:
      return {
        label: 'LOW',
        color: '#10b981',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
        dotClass: 'bg-emerald-500',
        borderClass: 'border-emerald-500',
        bgSubtle: 'bg-emerald-50/50',
      };
  }
}

export function getAlertStatusConfig(status) {
  const st = String(status || '').toUpperCase();
  switch (st) {
    case 'OPEN':
      return {
        label: 'Open',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        dotClass: 'bg-rose-500',
      };
    case 'UNDER_REVIEW':
      return {
        label: 'Under Review',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        dotClass: 'bg-blue-500',
      };
    case 'RESOLVED':
      return {
        label: 'Resolved',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    case 'FALSE_POSITIVE':
      return {
        label: 'False Positive',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        dotClass: 'bg-slate-400',
      };
    default:
      return {
        label: status || 'Unknown',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-400',
      };
  }
}

