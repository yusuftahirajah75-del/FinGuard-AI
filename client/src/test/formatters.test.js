import { describe, test, expect } from 'vitest';
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
  formatScore,
  getRiskLevelConfig,
  getAlertStatusConfig,
} from '../utils/formatters.js';

describe('Frontend Formatters & Risk Utilities', () => {
  describe('formatCurrency', () => {
    test('formats valid numbers to USD currency', () => {
      expect(formatCurrency(1250.5)).toBe('$1,250.50');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(999999.99)).toBe('$999,999.99');
    });

    test('handles null, undefined, or NaN gracefully', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
      expect(formatCurrency('abc')).toBe('$0.00');
    });
  });

  describe('formatDateTime', () => {
    test('formats ISO strings to standard UTC display', () => {
      const res = formatDateTime('2026-10-15T12:30:00.000Z');
      expect(res).toContain('Oct 15, 2026');
      expect(res).toContain('12:30:00');
      expect(res).toContain('UTC');
    });

    test('handles empty or invalid dates', () => {
      expect(formatDateTime(null)).toBe('—');
      expect(formatDateTime('')).toBe('—');
    });
  });

  describe('formatScore', () => {
    test('formats decimal scores to 1 decimal place', () => {
      expect(formatScore(85.432)).toBe('85.4');
      expect(formatScore(0)).toBe('0.0');
      expect(formatScore(null)).toBe('—');
    });
  });

  describe('getRiskLevelConfig', () => {
    test('returns accurate color classes for all risk tiers', () => {
      expect(getRiskLevelConfig('CRITICAL').label).toBe('CRITICAL');
      expect(getRiskLevelConfig('CRITICAL').color).toBe('#ef4444');

      expect(getRiskLevelConfig('HIGH').label).toBe('HIGH');
      expect(getRiskLevelConfig('HIGH').color).toBe('#f97316');

      expect(getRiskLevelConfig('MEDIUM').label).toBe('MEDIUM');
      expect(getRiskLevelConfig('MEDIUM').color).toBe('#f59e0b');

      expect(getRiskLevelConfig('LOW').label).toBe('LOW');
      expect(getRiskLevelConfig('LOW').color).toBe('#10b981');
    });
  });

  describe('getAlertStatusConfig', () => {
    test('returns correct labels for case statuses', () => {
      expect(getAlertStatusConfig('OPEN').label).toBe('Open');
      expect(getAlertStatusConfig('UNDER_REVIEW').label).toBe('Under Review');
      expect(getAlertStatusConfig('RESOLVED').label).toBe('Resolved');
      expect(getAlertStatusConfig('FALSE_POSITIVE').label).toBe('False Positive');
    });
  });
});

