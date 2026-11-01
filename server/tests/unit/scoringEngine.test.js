import ScoringEngine from '../../src/detection/scoring/scoringEngine.js';

describe('ScoringEngine & Risk Classification', () => {
  const engine = new ScoringEngine({
    weights: {
      amount: 0.35,
      velocity: 0.25,
      unusual_time: 0.15,
      repeated_transaction: 0.15,
      new_beneficiary: 0.10,
    },
    alertThreshold: 60.0,
  });

  test('classifies risk levels accurately', () => {
    expect(engine.classifyRisk(15.0)).toBe('LOW');
    expect(engine.classifyRisk(29.99)).toBe('LOW');
    expect(engine.classifyRisk(30.0)).toBe('MEDIUM');
    expect(engine.classifyRisk(59.99)).toBe('MEDIUM');
    expect(engine.classifyRisk(60.0)).toBe('HIGH');
    expect(engine.classifyRisk(79.99)).toBe('HIGH');
    expect(engine.classifyRisk(80.0)).toBe('CRITICAL');
    expect(engine.classifyRisk(100.0)).toBe('CRITICAL');
  });

  test('computes composite score when all signals are available', () => {
    const signals = {
      amount: { signalAvailable: true, rawScore: 80, triggered: true, explanation: 'Amount spike' },
      velocity: { signalAvailable: true, rawScore: 60, triggered: true, explanation: 'Velocity burst' },
      unusual_time: { signalAvailable: true, rawScore: 10, triggered: false, explanation: 'Time ok' },
      repeated_transaction: { signalAvailable: true, rawScore: 0, triggered: false, explanation: 'No repeat' },
      new_beneficiary: { signalAvailable: true, rawScore: 45, triggered: true, explanation: 'New recipient' },
    };

    // Expected: 80*0.35 (28) + 60*0.25 (15) + 10*0.15 (1.5) + 0*0.15 (0) + 45*0.10 (4.5) = 49.0
    const result = engine.calculateCompositeScore(signals);
    expect(result.anomalyScore).toBe(49.0);
    expect(result.riskLevel).toBe('MEDIUM');
    expect(result.isAlertTriggered).toBe(false);
    expect(result.missingSignalsCount).toBe(0);
    expect(result.activeWeightsSum).toBe(1.0);
  });

  test('proportionally re-normalizes weights when signals are missing/unavailable', () => {
    const signals = {
      amount: { signalAvailable: false, rawScore: 0, triggered: false, metrics: { reason: 'INSUFFICIENT_HISTORY' }, explanation: 'No history' },
      velocity: { signalAvailable: true, rawScore: 80, triggered: true, explanation: 'Velocity burst' },
      unusual_time: { signalAvailable: false, rawScore: 0, triggered: false, metrics: { reason: 'INSUFFICIENT_HISTORY' }, explanation: 'No history' },
      repeated_transaction: { signalAvailable: true, rawScore: 0, triggered: false, explanation: 'No repeat' },
      new_beneficiary: { signalAvailable: true, rawScore: 45, triggered: true, explanation: 'New recipient' },
    };

    // Available weights: velocity (0.25), repeated (0.15), new_beneficiary (0.10) => sum = 0.50
    // Weighted sum: 80*0.25 (20) + 0*0.15 (0) + 45*0.10 (4.5) = 24.5
    // Normalized score: 24.5 / 0.50 = 49.0
    const result = engine.calculateCompositeScore(signals);
    expect(result.anomalyScore).toBe(49.0);
    expect(result.missingSignalsCount).toBe(2);
    expect(result.activeWeightsSum).toBe(0.5);
    expect(result.explanation).toContain('weights were normalized');
  });

  test('triggers alert flag when composite score exceeds threshold (60.0)', () => {
    const signals = {
      amount: { signalAvailable: true, rawScore: 95, triggered: true, explanation: 'Extreme amount' },
      velocity: { signalAvailable: true, rawScore: 90, triggered: true, explanation: 'Extreme velocity' },
      unusual_time: { signalAvailable: true, rawScore: 70, triggered: true, explanation: 'Night txn' },
      repeated_transaction: { signalAvailable: true, rawScore: 0, triggered: false, explanation: 'No repeat' },
      new_beneficiary: { signalAvailable: true, rawScore: 45, triggered: true, explanation: 'New bene' },
    };

    // 95*0.35 (33.25) + 90*0.25 (22.5) + 70*0.15 (10.5) + 0*0.15 (0) + 45*0.10 (4.5) = 70.75
    const result = engine.calculateCompositeScore(signals);
    expect(result.anomalyScore).toBe(70.75);
    expect(result.riskLevel).toBe('HIGH');
    expect(result.isAlertTriggered).toBe(true);
  });
});

