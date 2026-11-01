import AmountDetector from '../../src/detection/detectors/amountDetector.js';
import VelocityDetector from '../../src/detection/detectors/velocityDetector.js';
import UnusualTimeDetector from '../../src/detection/detectors/unusualTimeDetector.js';
import RepeatedTransactionDetector from '../../src/detection/detectors/repeatedTransactionDetector.js';
import NewBeneficiaryDetector from '../../src/detection/detectors/newBeneficiaryDetector.js';

describe('Modular Statistical Detectors', () => {
  const baseTimestamp = new Date('2026-10-15T12:00:00Z').toISOString();

  describe('AmountDetector', () => {
    const detector = new AmountDetector({ minHistoryCount: 3, modifiedZThreshold: 3.0 });

    test('flags significant amount anomaly', () => {
      const currentTx = {
        id: 'tx-1',
        amount: 5000.00,
        transaction_timestamp: baseTimestamp,
      };

      const history = [
        { id: 'h-1', amount: 50.00, transaction_timestamp: '2026-10-10T10:00:00Z' },
        { id: 'h-2', amount: 55.00, transaction_timestamp: '2026-10-11T11:00:00Z' },
        { id: 'h-3', amount: 48.00, transaction_timestamp: '2026-10-12T12:00:00Z' },
        { id: 'h-4', amount: 52.00, transaction_timestamp: '2026-10-13T13:00:00Z' },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.signalAvailable).toBe(true);
      expect(result.triggered).toBe(true);
      expect(result.rawScore).toBeGreaterThanOrEqual(70);
      expect(result.explanation).toContain('is an anomaly');
    });

    test('returns normal score for typical amount', () => {
      const currentTx = {
        id: 'tx-2',
        amount: 51.00,
        transaction_timestamp: baseTimestamp,
      };

      const history = [
        { id: 'h-1', amount: 50.00, transaction_timestamp: '2026-10-10T10:00:00Z' },
        { id: 'h-2', amount: 55.00, transaction_timestamp: '2026-10-11T11:00:00Z' },
        { id: 'h-3', amount: 48.00, transaction_timestamp: '2026-10-12T12:00:00Z' },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.signalAvailable).toBe(true);
      expect(result.triggered).toBe(false);
      expect(result.rawScore).toBeLessThan(20);
    });

    test('handles insufficient history (< 3 records) with UNAVAILABLE signal', () => {
      const currentTx = {
        id: 'tx-3',
        amount: 500.00,
        transaction_timestamp: baseTimestamp,
      };

      const history = [
        { id: 'h-1', amount: 50.00, transaction_timestamp: '2026-10-10T10:00:00Z' },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.signalAvailable).toBe(false);
      expect(result.metrics.reason).toBe('INSUFFICIENT_HISTORY');
    });

    test('prevents future-data leakage by ignoring timestamps after candidate', () => {
      const currentTx = {
        id: 'tx-4',
        amount: 50.00,
        transaction_timestamp: '2026-10-10T12:00:00Z',
      };

      const history = [
        // One prior transaction
        { id: 'h-1', amount: 50.00, transaction_timestamp: '2026-10-09T10:00:00Z' },
        // Two FUTURE transactions that should be ignored
        { id: 'h-future-1', amount: 50.00, transaction_timestamp: '2026-10-11T10:00:00Z' },
        { id: 'h-future-2', amount: 50.00, transaction_timestamp: '2026-10-12T10:00:00Z' },
      ];

      const result = detector.evaluate(currentTx, history);
      // Because future transactions are excluded, valid history is only 1, which is insufficient
      expect(result.signalAvailable).toBe(false);
      expect(result.metrics.historicalCount).toBe(1);
    });

    test('excludes the candidate transaction itself from historical set', () => {
      const currentTx = {
        id: 'tx-5',
        amount: 5000.00,
        transaction_timestamp: baseTimestamp,
      };

      const history = [
        currentTx, // self included in history array
        { id: 'h-1', amount: 50.00, transaction_timestamp: '2026-10-10T10:00:00Z' },
        { id: 'h-2', amount: 55.00, transaction_timestamp: '2026-10-11T11:00:00Z' },
        { id: 'h-3', amount: 48.00, transaction_timestamp: '2026-10-12T12:00:00Z' },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.metrics.historicalCount).toBe(3);
    });
  });

  describe('VelocityDetector', () => {
    const detector = new VelocityDetector({ window5mThreshold: 3, window1hThreshold: 8 });

    test('detects 5-minute velocity burst', () => {
      const now = new Date('2026-10-15T12:00:00Z').getTime();
      const currentTx = {
        id: 'tx-v1',
        transaction_timestamp: new Date(now).toISOString(),
      };

      // 4 transactions within past 4 minutes
      const history = [
        { id: 'v-1', transaction_timestamp: new Date(now - 60000).toISOString() },
        { id: 'v-2', transaction_timestamp: new Date(now - 120000).toISOString() },
        { id: 'v-3', transaction_timestamp: new Date(now - 180000).toISOString() },
        { id: 'v-4', transaction_timestamp: new Date(now - 240000).toISOString() },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.triggered).toBe(true);
      expect(result.metrics.burst5m).toBe(true);
      expect(result.metrics.count5m).toBe(4);
      expect(result.rawScore).toBeGreaterThanOrEqual(60);
      expect(result.explanation).toContain('Rapid transaction velocity burst');
    });

    test('normal velocity yields low score', () => {
      const now = new Date('2026-10-15T12:00:00Z').getTime();
      const currentTx = {
        id: 'tx-v2',
        transaction_timestamp: new Date(now).toISOString(),
      };

      // 1 transaction 30 minutes ago
      const history = [
        { id: 'v-1', transaction_timestamp: new Date(now - 1800000).toISOString() },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.triggered).toBe(false);
      expect(result.rawScore).toBeLessThan(10);
    });
  });

  describe('UnusualTimeDetector', () => {
    const detector = new UnusualTimeDetector({ minHistoryCount: 5, hourProbabilityThreshold: 0.05 });

    test('flags transaction during unusual nocturnal hours', () => {
      // Current transaction at 03:00 UTC
      const currentTx = {
        id: 'tx-t1',
        transaction_timestamp: '2026-10-15T03:15:00Z',
      };

      // Customer habitually transacts only during afternoon (14:00 - 18:00 UTC)
      const history = [
        { id: 't-1', transaction_timestamp: '2026-10-01T14:00:00Z' },
        { id: 't-2', transaction_timestamp: '2026-10-02T15:00:00Z' },
        { id: 't-3', transaction_timestamp: '2026-10-03T16:00:00Z' },
        { id: 't-4', transaction_timestamp: '2026-10-04T17:00:00Z' },
        { id: 't-5', transaction_timestamp: '2026-10-05T15:30:00Z' },
        { id: 't-6', transaction_timestamp: '2026-10-06T14:45:00Z' },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.signalAvailable).toBe(true);
      expect(result.triggered).toBe(true);
      expect(result.rawScore).toBeGreaterThanOrEqual(50);
      expect(result.explanation).toContain('03:00 UTC');
    });

    test('returns unavailable for sparse history (< 5 transactions)', () => {
      const currentTx = {
        id: 'tx-t2',
        transaction_timestamp: '2026-10-15T03:15:00Z',
      };

      const history = [
        { id: 't-1', transaction_timestamp: '2026-10-01T14:00:00Z' },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.signalAvailable).toBe(false);
    });
  });

  describe('RepeatedTransactionDetector', () => {
    const detector = new RepeatedTransactionDetector({ windowMinutes: 30, amountTolerancePercent: 0.01 });

    test('detects identical transfer to same beneficiary within 30 minutes', () => {
      const now = new Date('2026-10-15T12:00:00Z').getTime();
      const currentTx = {
        id: 'tx-r1',
        beneficiary_reference: 'BEN-ACME',
        amount: 250.00,
        transaction_timestamp: new Date(now).toISOString(),
      };

      const history = [
        {
          id: 'h-r1',
          transaction_reference: 'TXN-PREV',
          beneficiary_reference: 'BEN-ACME',
          amount: 250.00,
          transaction_timestamp: new Date(now - (5 * 60 * 1000)).toISOString(), // 5 mins ago
        },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.triggered).toBe(true);
      expect(result.rawScore).toBe(75.0);
      expect(result.explanation).toContain('Potential duplicate transaction');
    });

    test('ignores transfers outside the time window (> 30 minutes)', () => {
      const now = new Date('2026-10-15T12:00:00Z').getTime();
      const currentTx = {
        id: 'tx-r2',
        beneficiary_reference: 'BEN-ACME',
        amount: 250.00,
        transaction_timestamp: new Date(now).toISOString(),
      };

      const history = [
        {
          id: 'h-r2',
          transaction_reference: 'TXN-OLD',
          beneficiary_reference: 'BEN-ACME',
          amount: 250.00,
          transaction_timestamp: new Date(now - (45 * 60 * 1000)).toISOString(), // 45 mins ago
        },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.triggered).toBe(false);
      expect(result.rawScore).toBe(0);
    });
  });

  describe('NewBeneficiaryDetector', () => {
    const detector = new NewBeneficiaryDetector({ minHistoryCount: 3, noveltySignalScore: 45.0 });

    test('flags unseen beneficiary as novelty factor without claiming fraud', () => {
      const currentTx = {
        id: 'tx-b1',
        beneficiary_reference: 'BEN-NEW-PAYEE',
        transaction_timestamp: baseTimestamp,
      };

      const history = [
        { id: 'b-1', beneficiary_reference: 'BEN-UTILITY', transaction_timestamp: '2026-10-01T10:00:00Z' },
        { id: 'b-2', beneficiary_reference: 'BEN-GROCERY', transaction_timestamp: '2026-10-02T10:00:00Z' },
        { id: 'b-3', beneficiary_reference: 'BEN-RENT', transaction_timestamp: '2026-10-03T10:00:00Z' },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.signalAvailable).toBe(true);
      expect(result.triggered).toBe(true);
      expect(result.rawScore).toBe(45.0);
      expect(result.explanation).toContain('not inherently fraudulent');
    });

    test('recognizes existing beneficiary with rawScore 0', () => {
      const currentTx = {
        id: 'tx-b2',
        beneficiary_reference: 'BEN-RENT',
        transaction_timestamp: baseTimestamp,
      };

      const history = [
        { id: 'b-1', beneficiary_reference: 'BEN-UTILITY', transaction_timestamp: '2026-10-01T10:00:00Z' },
        { id: 'b-2', beneficiary_reference: 'BEN-RENT', transaction_timestamp: '2026-10-02T10:00:00Z' },
        { id: 'b-3', beneficiary_reference: 'BEN-GROCERY', transaction_timestamp: '2026-10-03T10:00:00Z' },
      ];

      const result = detector.evaluate(currentTx, history);
      expect(result.signalAvailable).toBe(true);
      expect(result.triggered).toBe(false);
      expect(result.rawScore).toBe(0);
    });
  });
});
