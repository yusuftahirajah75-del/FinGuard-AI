import transactionRepository from '../repositories/transactionRepository.js';
import anomalyRepository from '../repositories/anomalyRepository.js';
import alertRepository from '../repositories/alertRepository.js';
import auditLogRepository from '../repositories/auditLogRepository.js';
import settingsRepository from '../repositories/settingsRepository.js';
import DetectionEngine from '../detection/engine/detectionEngine.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';

export class DetectionService {
  /**
   * Instantiate or configure detection engine with active database settings
   */
  async getEngine() {
    try {
      const dbSettings = await settingsRepository.getSettings('default');
      if (dbSettings) {
        return new DetectionEngine({
          weights: dbSettings.weights,
          thresholds: dbSettings.thresholds,
          algorithmVersion: config.ALGORITHM_VERSION,
        });
      }
    } catch (err) {
      logger.warn('Could not load custom settings from DB, falling back to defaults', { error: err.message });
    }
    return new DetectionEngine({
      algorithmVersion: config.ALGORITHM_VERSION,
    });
  }

  /**
   * Analyze a single transaction by ID
   */
  async analyzeTransaction(transactionId) {
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) {
      const error = new Error(`Transaction with ID '${transactionId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    // Retrieve strictly prior history for customer
    const history = await transactionRepository.findCustomerHistory(
      transaction.customer_reference,
      transaction.transaction_timestamp
    );

    const engine = await this.getEngine();
    const result = engine.analyzeTransaction(transaction, history);

    // Save anomaly result in database
    const savedResult = await anomalyRepository.create({
      transaction_id: transaction.id,
      anomaly_score: result.anomalyScore,
      risk_level: result.riskLevel,
      detection_status: result.detectionStatus,
      signal_results: result.signalResults,
      explanation: result.explanation,
      algorithm_version: result.algorithmVersion,
    });

    let alertRecord = null;
    let alertCreated = false;

    // Check if alert should be triggered
    if (result.isAlertTriggered) {
      // Check if alert already exists to prevent duplicates
      const existingAlert = await alertRepository.findByTransactionAndResult(
        transaction.id,
        savedResult.id
      );

      if (!existingAlert) {
        alertRecord = await alertRepository.create({
          transaction_id: transaction.id,
          anomaly_result_id: savedResult.id,
          severity: result.riskLevel,
          status: 'OPEN',
          investigation_notes: `System generated alert: Anomaly score ${result.anomalyScore}/100. ${result.explanation}`,
        });

        alertCreated = true;

        // Log in audit table
        await auditLogRepository.create({
          alert_id: alertRecord.id,
          action: 'ALERT_CREATED',
          previous_value: null,
          new_value: {
            status: 'OPEN',
            severity: result.riskLevel,
            anomaly_score: result.anomalyScore,
          },
          actor_reference: 'FTADS-DETECTION-ENGINE',
        });
      } else {
        alertRecord = existingAlert;
      }
    }

    return {
      transactionId: transaction.id,
      transactionReference: transaction.transaction_reference,
      anomalyScore: result.anomalyScore,
      riskLevel: result.riskLevel,
      detectionStatus: result.detectionStatus,
      signals: result.signalResults,
      explanation: result.explanation,
      alertCreated,
      alert: alertRecord,
      algorithmVersion: result.algorithmVersion,
      durationMs: result.durationMs,
      analyzedAt: savedResult.analyzed_at,
    };
  }

  /**
   * Batch analyze transactions
   */
  async analyzeBatch(options = {}) {
    const { limit = 100, onlyUnanalyzed = true } = options;

    let targetTransactionsSql = `
      SELECT t.id, t.customer_reference, t.transaction_timestamp
      FROM transactions t
    `;

    if (onlyUnanalyzed) {
      targetTransactionsSql += `
        LEFT JOIN anomaly_results ar ON ar.transaction_id = t.id
        WHERE ar.id IS NULL
      `;
    }

    targetTransactionsSql += `
      ORDER BY t.transaction_timestamp ASC
      LIMIT $1
    `;

    const candidates = await query(targetTransactionsSql, [limit]);
    const itemsToProcess = candidates.rows;

    logger.info(`Starting batch analysis for ${itemsToProcess.length} transactions...`);

    const startTime = performance.now();
    let analyzedCount = 0;
    let alertsTriggeredCount = 0;
    const scores = [];

    for (const item of itemsToProcess) {
      try {
        const analysis = await this.analyzeTransaction(item.id);
        analyzedCount++;
        scores.push(analysis.anomalyScore);
        if (analysis.alertCreated) {
          alertsTriggeredCount++;
        }
      } catch (err) {
        logger.error(`Error analyzing transaction ${item.id} in batch`, { error: err.message });
      }
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));
    const avgScore = scores.length > 0
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : 0;

    return {
      totalProcessed: analyzedCount,
      alertsTriggered: alertsTriggeredCount,
      averageScore: avgScore,
      durationMs,
      batchLimit: limit,
    };
  }

  /**
   * Get detection results for a transaction
   */
  async getResultsByTransactionId(transactionId) {
    const result = await anomalyRepository.findByTransactionId(transactionId);
    if (!result) {
      const error = new Error(`Anomaly detection result not found for transaction '${transactionId}'`);
      error.statusCode = 404;
      throw error;
    }

    // Check associated alert
    const alert = await alertRepository.findByTransactionAndResult(transactionId, result.id);

    return {
      ...result,
      alert: alert || null,
    };
  }

  /**
   * Methodology documentation
   */
  getMethodology() {
    return {
      system: 'Financial Transaction Anomaly Detection System (FTADS)',
      engineType: 'Multi-Signal Explainable Statistical Anomaly Detection Engine',
      algorithmVersion: config.ALGORITHM_VERSION,
      framework: 'Academic Rule-Based & Statistical Deviations (Non-ML)',
      guarantees: {
        determinism: '100% deterministic score output given identical historical state',
        leakagePrevention: 'Strict temporal filtering ensures no future data is accessed',
        explainability: 'Full mathematical breakdown and human-readable natural language justification for every flag',
      },
      detectors: [
        {
          name: 'Amount Anomaly Detector',
          nominalWeight: '35%',
          method: 'Median Absolute Deviation (MAD) & Modified Z-Score',
          formula: 'M_i = 0.6745 * (Amount - Median) / MAD',
          fallbacks: 'Mean Absolute Deviation (MeanAD) fallback when MAD = 0; Relative ratio fallback for uniform baselines.',
          minHistory: 3,
        },
        {
          name: 'Transaction Velocity Burst Detector',
          nominalWeight: '25%',
          method: 'Temporal rolling window event counters',
          windows: ['5-minute window (bursts >= 3)', '1-hour window (bursts >= 8)'],
          rationale: 'Detects rapid automated sweeps, card stuffing scripts, and unauthorized account drainage.',
        },
        {
          name: 'Unusual Transaction Time Detector',
          nominalWeight: '15%',
          method: 'Empirical hourly probability density analysis',
          minHistory: 5,
          rationale: 'Flags nocturnal or out-of-character transaction times based on customer diurnal habits.',
        },
        {
          name: 'Repeated Transaction Detector',
          nominalWeight: '15%',
          method: 'Multi-attribute matching (Customer, Beneficiary, Amount +-1%, Window <= 30m)',
          rationale: 'Catches automated billing retries, duplicate charges, and rapid replay attacks.',
        },
        {
          name: 'New Beneficiary Detector',
          nominalWeight: '10%',
          method: 'Historical counterparty presence check',
          minHistory: 3,
          rationale: 'Flags previously unseen recipients without prematurely declaring novelty as fraud.',
        },
      ],
      scoring: {
        normalization: 'Proportional weight re-scaling when historical signals are unavailable',
        formula: 'Composite Score = Sum(Weight_i * Score_i) / Sum(Available_Weights)',
        riskTiers: {
          LOW: '0.00 - 29.99',
          MEDIUM: '30.00 - 59.99',
          HIGH: '60.00 - 79.99',
          CRITICAL: '80.00 - 100.00',
        },
        alertTriggerThreshold: config.ANOMALY_ALERT_THRESHOLD,
      },
    };
  }

  /**
   * Get settings
   */
  async getSettings() {
    const settings = await settingsRepository.getSettings('default');
    return settings || {
      weights: {
        amount: 0.35,
        velocity: 0.25,
        unusual_time: 0.15,
        repeated_transaction: 0.15,
        new_beneficiary: 0.10,
      },
      thresholds: {
        alert_trigger_score: 60.0,
      },
    };
  }

  /**
   * Update settings
   */
  async updateSettings(data) {
    return settingsRepository.updateSettings('default', data);
  }
}

export default new DetectionService();

