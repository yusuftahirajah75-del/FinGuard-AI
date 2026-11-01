import {
  calculateMedian,
  calculateMAD,
  calculateMeanAD,
  calculateModifiedZScore,
  zScoreToAnomalyScore,
} from '../../src/utils/mathUtils.js';

describe('Statistical Math Utilities', () => {
  describe('calculateMedian', () => {
    test('calculates median for odd-length array', () => {
      expect(calculateMedian([5, 1, 9, 3, 7])).toBe(5);
    });

    test('calculates median for even-length array', () => {
      expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
    });

    test('handles single-element array', () => {
      expect(calculateMedian([42])).toBe(42);
    });

    test('handles empty array', () => {
      expect(calculateMedian([])).toBe(0);
    });
  });

  describe('calculateMAD (Median Absolute Deviation)', () => {
    test('calculates correct MAD for varied data', () => {
      // Data: [1, 2, 3, 4, 5, 6, 7, 8, 9] -> median = 5
      // Deviations from 5: [4, 3, 2, 1, 0, 1, 2, 3, 4] -> sorted: [0, 1, 1, 2, 2, 3, 3, 4, 4] -> median = 2
      expect(calculateMAD([1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(2);
    });

    test('returns 0 when all values are identical (Zero MAD)', () => {
      expect(calculateMAD([100, 100, 100, 100])).toBe(0);
    });
  });

  describe('calculateMeanAD (Mean Absolute Deviation Fallback)', () => {
    test('calculates Mean Absolute Deviation correctly', () => {
      // Data: [10, 20] -> mean = 15 -> deviations: [5, 5] -> meanAD = 5
      expect(calculateMeanAD([10, 20])).toBe(5);
    });

    test('returns 0 for identical values', () => {
      expect(calculateMeanAD([50, 50, 50])).toBe(0);
    });
  });

  describe('calculateModifiedZScore', () => {
    test('computes standard Iglewicz-Hoaglin modified Z-score when MAD > 0', () => {
      const history = [10, 12, 11, 13, 12, 14, 10];
      const result = calculateModifiedZScore(50, history);
      expect(result.fallbackUsed).toBeNull();
      expect(result.modifiedZScore).toBeGreaterThan(5.0);
      expect(result.median).toBe(12);
      expect(result.mad).toBeGreaterThan(0);
    });

    test('handles Zero MAD when candidate value equals median', () => {
      const history = [100, 100, 100, 100];
      const result = calculateModifiedZScore(100, history);
      expect(result.modifiedZScore).toBe(0);
      expect(result.fallbackUsed).toBe('IDENTICAL_MATCH');
    });

    test('handles Zero MAD fallback when candidate value deviates from identical baseline', () => {
      const history = [100, 100, 100, 100];
      const result = calculateModifiedZScore(500, history);
      expect(result.mad).toBe(0);
      expect(result.fallbackUsed).toBe('RELATIVE_RATIO_MULTIPLIER');
      expect(result.modifiedZScore).toBeGreaterThan(3.0);
    });

    test('handles empty history gracefully', () => {
      const result = calculateModifiedZScore(100, []);
      expect(result.modifiedZScore).toBe(0);
      expect(result.fallbackUsed).toBe('NO_HISTORY');
    });
  });

  describe('zScoreToAnomalyScore', () => {
    test('bounds scores strictly between 0 and 100', () => {
      expect(zScoreToAnomalyScore(0)).toBe(0);
      expect(zScoreToAnomalyScore(0.5)).toBeGreaterThanOrEqual(0);
      expect(zScoreToAnomalyScore(0.5)).toBeLessThanOrEqual(10);
      expect(zScoreToAnomalyScore(3.0)).toBeGreaterThanOrEqual(40);
      expect(zScoreToAnomalyScore(100.0)).toBeLessThanOrEqual(100);
    });
  });
});
