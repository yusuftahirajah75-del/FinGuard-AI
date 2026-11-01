import { query } from '../config/database.js';
import transactionRepository from '../repositories/transactionRepository.js';
import anomalyRepository from '../repositories/anomalyRepository.js';
import alertRepository from '../repositories/alertRepository.js';
import { generateCsvString } from '../utils/csvUtils.js';

export class ReportService {
  /**
   * Executive summary analytics
   */
  async getSummary() {
    const totalTransactions = await transactionRepository.countAll();
    const anomalyStats = await anomalyRepository.getSummaryStats();
    const riskBreakdown = await anomalyRepository.getRiskBreakdown();
    const alertStatusBreakdown = await alertRepository.getStatusBreakdown();
    const alertSeverityBreakdown = await alertRepository.getSeverityBreakdown();

    // Volume by channel
    const channelRes = await query(`
      SELECT transaction_channel, COUNT(*) as count, SUM(amount)::numeric(15,2) as total_volume
      FROM transactions
      GROUP BY transaction_channel
      ORDER BY count DESC
    `);

    return {
      transactions: {
        total: totalTransactions,
        analyzed: parseInt(anomalyStats.total_analyzed, 10),
        unanalyzed: totalTransactions - parseInt(anomalyStats.total_analyzed, 10),
        channelDistribution: channelRes.rows,
      },
      detection: {
        averageAnomalyScore: parseFloat(anomalyStats.average_score),
        highRiskCount: parseInt(anomalyStats.high_risk_count, 10),
        riskBreakdown,
      },
      alerts: {
        total: alertStatusBreakdown.reduce((sum, item) => sum + parseInt(item.count, 10), 0),
        statusBreakdown: alertStatusBreakdown,
        severityBreakdown: alertSeverityBreakdown,
      },
    };
  }

  /**
   * Academic Evaluation: Confusion Matrix & Metrics calculation
   * Compares synthetic ground-truth labels against statistical anomaly predictions.
   */
  async getConfusionMatrix(options = {}) {
    const threshold = options.threshold ? parseFloat(options.threshold) : 60.0;

    // Retrieve transactions that have been evaluated by the anomaly detection engine
    const sql = `
      SELECT t.id, t.synthetic_ground_truth_label, ar.anomaly_score, ar.risk_level
      FROM transactions t
      JOIN anomaly_results ar ON ar.transaction_id = t.id
    `;
    const res = await query(sql);
    const rows = res.rows;

    let tp = 0; // Ground truth SUSPICIOUS & Predicted SUSPICIOUS (score >= threshold)
    let fp = 0; // Ground truth NORMAL & Predicted SUSPICIOUS
    let tn = 0; // Ground truth NORMAL & Predicted NORMAL (score < threshold)
    let fn = 0; // Ground truth SUSPICIOUS & Predicted NORMAL

    for (const r of rows) {
      const isActualSuspicious = r.synthetic_ground_truth_label === 'SUSPICIOUS';
      const isPredictedSuspicious = parseFloat(r.anomaly_score) >= threshold;

      if (isActualSuspicious && isPredictedSuspicious) {
        tp++;
      } else if (!isActualSuspicious && isPredictedSuspicious) {
        fp++;
      } else if (!isActualSuspicious && !isPredictedSuspicious) {
        tn++;
      } else if (isActualSuspicious && !isPredictedSuspicious) {
        fn++;
      }
    }

    const totalEvaluated = tp + fp + tn + fn;

    // Academic Metrics calculation with safe zero denominator handling
    const precision = (tp + fp) > 0 ? Number((tp / (tp + fp)).toFixed(4)) : 0.0;
    const recall = (tp + fn) > 0 ? Number((tp / (tp + fn)).toFixed(4)) : 0.0;
    const specificity = (tn + fp) > 0 ? Number((tn / (tn + fp)).toFixed(4)) : 0.0;
    const accuracy = totalEvaluated > 0 ? Number(((tp + tn) / totalEvaluated).toFixed(4)) : 0.0;
    const f1Score = (precision + recall) > 0
      ? Number(((2 * precision * recall) / (precision + recall)).toFixed(4))
      : 0.0;

    return {
      evaluationMetadata: {
        totalEvaluated,
        decisionThreshold: threshold,
        evaluatedAt: new Date().toISOString(),
        note: 'Ground truth synthetic labels are used exclusively for academic validation and have zero influence on anomaly scoring.',
      },
      confusionMatrix: {
        truePositives: tp,
        falsePositives: fp,
        trueNegatives: tn,
        falseNegatives: fn,
      },
      metrics: {
        accuracy,
        precision,
        recall,
        sensitivity: recall,
        specificity,
        f1Score,
        accuracyPercent: `${(accuracy * 100).toFixed(2)}%`,
        precisionPercent: `${(precision * 100).toFixed(2)}%`,
        recallPercent: `${(recall * 100).toFixed(2)}%`,
        f1ScorePercent: `${(f1Score * 100).toFixed(2)}%`,
      },
      breakdown: {
        actualSuspicious: tp + fn,
        actualNormal: tn + fp,
        predictedSuspicious: tp + fp,
        predictedNormal: tn + fn,
      },
    };
  }

  /**
   * Export transactions or alerts to sanitized CSV
   */
  async exportCsv(type = 'transactions', limit = 1000) {
    let rows = [];

    if (type === 'alerts') {
      const sql = `
        SELECT 
          al.id as alert_id,
          al.severity,
          al.status,
          al.assigned_analyst,
          al.created_at as alert_created_at,
          t.transaction_reference,
          t.customer_reference,
          t.amount,
          t.currency,
          t.transaction_channel,
          t.transaction_timestamp,
          ar.anomaly_score,
          ar.risk_level,
          ar.explanation
        FROM alerts al
        JOIN transactions t ON t.id = al.transaction_id
        JOIN anomaly_results ar ON ar.id = al.anomaly_result_id
        ORDER BY al.created_at DESC
        LIMIT $1
      `;
      const res = await query(sql, [limit]);
      rows = res.rows;
    } else {
      // Default: transactions with detection status
      const sql = `
        SELECT 
          t.id,
          t.transaction_reference,
          t.customer_reference,
          t.source_account_reference,
          t.beneficiary_reference,
          t.amount,
          t.currency,
          t.transaction_type,
          t.transaction_channel,
          t.transaction_location,
          t.transaction_timestamp,
          t.transaction_status,
          t.synthetic_ground_truth_label,
          ar.anomaly_score,
          ar.risk_level,
          al.id as alert_id,
          al.status as alert_status
        FROM transactions t
        LEFT JOIN anomaly_results ar ON ar.transaction_id = t.id
        LEFT JOIN alerts al ON al.transaction_id = t.id
        ORDER BY t.transaction_timestamp DESC
        LIMIT $1
      `;
      const res = await query(sql, [limit]);
      rows = res.rows;
    }

    return generateCsvString(rows);
  }
}

export default new ReportService();
