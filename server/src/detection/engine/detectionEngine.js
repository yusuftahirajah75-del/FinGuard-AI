import AmountDetector from '../detectors/amountDetector.js';
import VelocityDetector from '../detectors/velocityDetector.js';
import UnusualTimeDetector from '../detectors/unusualTimeDetector.js';
import RepeatedTransactionDetector from '../detectors/repeatedTransactionDetector.js';
import NewBeneficiaryDetector from '../detectors/newBeneficiaryDetector.js';
import ScoringEngine from '../scoring/scoringEngine.js';
import config from '../../config/config.js';

/**
 * FTADS Master Anomaly Detection Engine (Version 1.0.0)
 * 
 * Orchestrates multi-signal statistical detection across amount, velocity,
 * temporal distribution, repetition, and counterparty novelty.
 */
export class DetectionEngine {
  constructor(settings = {}) {
    this.version = settings.algorithmVersion || config.ALGORITHM_VERSION || '1.0.0';

    const thresholds = settings.thresholds || {};
    const weights = settings.weights || {
      amount: 0.35,
      velocity: 0.25,
      unusual_time: 0.15,
      repeated_transaction: 0.15,
      new_beneficiary: 0.10,
    };

    this.amountDetector = new AmountDetector(thresholds.amount);
    this.velocityDetector = new VelocityDetector(thresholds.velocity);
    this.unusualTimeDetector = new UnusualTimeDetector(thresholds.unusual_time);
    this.repeatedDetector = new RepeatedTransactionDetector(thresholds.repeated_transaction);
    this.newBeneficiaryDetector = new NewBeneficiaryDetector(thresholds.new_beneficiary);

    this.scoringEngine = new ScoringEngine({
      weights,
      alertThreshold: thresholds.alert_trigger_score ?? config.ANOMALY_ALERT_THRESHOLD ?? 60.0,
    });
  }

  /**
   * Analyzes a single transaction against prior historical context.
   * 
   * Strict anti-leakage guarantee:
   * Only past transactions (timestamp < transaction.transaction_timestamp) are considered.
   * The transaction itself is excluded from historical sets.
   * 
   * @param {Object} transaction - Transaction to evaluate
   * @param {Array<Object>} history - Customer past transactions
   * @returns {Object} Comprehensive analysis result
   */
  analyzeTransaction(transaction, history = []) {
    const startTime = performance.now();

    // Run all 5 statistical detectors
    const amountSignal = this.amountDetector.evaluate(transaction, history);
    const velocitySignal = this.velocityDetector.evaluate(transaction, history);
    const timeSignal = this.unusualTimeDetector.evaluate(transaction, history);
    const repeatedSignal = this.repeatedDetector.evaluate(transaction, history);
    const beneficiarySignal = this.newBeneficiaryDetector.evaluate(transaction, history);

    const signals = {
      amount: amountSignal,
      velocity: velocitySignal,
      unusual_time: timeSignal,
      repeated_transaction: repeatedSignal,
      new_beneficiary: beneficiarySignal,
    };

    // Calculate weighted composite score
    const scoreResult = this.scoringEngine.calculateCompositeScore(signals);
    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return {
      transactionId: transaction.id,
      transactionReference: transaction.transaction_reference,
      anomalyScore: scoreResult.anomalyScore,
      riskLevel: scoreResult.riskLevel,
      detectionStatus: 'ANALYZED',
      isAlertTriggered: scoreResult.isAlertTriggered,
      signalResults: scoreResult.signalContributions,
      explanation: scoreResult.explanation,
      algorithmVersion: this.version,
      analyzedAt: new Date().toISOString(),
      durationMs,
    };
  }
}

export default DetectionEngine;
