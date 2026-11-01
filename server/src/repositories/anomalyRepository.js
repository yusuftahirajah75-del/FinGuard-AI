import { query } from '../config/database.js';

export class AnomalyRepository {
  /**
   * Persist anomaly detection result
   */
  async create(data) {
    const sql = `
      INSERT INTO anomaly_results (
        id, transaction_id, anomaly_score, risk_level, detection_status,
        signal_results, explanation, algorithm_version, analyzed_at
      ) VALUES (
        COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW())
      )
      RETURNING *
    `;

    const params = [
      data.id || null,
      data.transaction_id,
      data.anomaly_score,
      data.risk_level,
      data.detection_status || 'ANALYZED',
      typeof data.signal_results === 'string' ? data.signal_results : JSON.stringify(data.signal_results),
      data.explanation,
      data.algorithm_version || '1.0.0',
      data.analyzed_at || null,
    ];

    const res = await query(sql, params);
    return res.rows[0];
  }

  /**
   * Find anomaly result by transaction UUID
   */
  async findByTransactionId(transactionId) {
    const sql = `
      SELECT ar.*, t.transaction_reference, t.amount, t.customer_reference, t.transaction_timestamp
      FROM anomaly_results ar
      JOIN transactions t ON t.id = ar.transaction_id
      WHERE ar.transaction_id = $1
      ORDER BY ar.analyzed_at DESC
      LIMIT 1
    `;
    const res = await query(sql, [transactionId]);
    return res.rows[0] || null;
  }

  /**
   * Find recent anomaly evaluations
   */
  async findRecent(limit = 10) {
    const sql = `
      SELECT ar.*, t.transaction_reference, t.amount, t.customer_reference, t.transaction_channel
      FROM anomaly_results ar
      JOIN transactions t ON t.id = ar.transaction_id
      ORDER BY ar.analyzed_at DESC
      LIMIT $1
    `;
    const res = await query(sql, [limit]);
    return res.rows;
  }

  /**
   * Get risk distribution breakdown
   */
  async getRiskBreakdown() {
    const sql = `
      SELECT risk_level, COUNT(*) as count, AVG(anomaly_score)::numeric(5,2) as avg_score
      FROM anomaly_results
      GROUP BY risk_level
      ORDER BY 
        CASE risk_level 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          ELSE 4 
        END
    `;
    const res = await query(sql);
    return res.rows;
  }

  /**
   * Get overall count and average anomaly score
   */
  async getSummaryStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_analyzed,
        COALESCE(AVG(anomaly_score), 0)::numeric(5,2) as average_score,
        COUNT(CASE WHEN risk_level IN ('HIGH', 'CRITICAL') THEN 1 END) as high_risk_count
      FROM anomaly_results
    `;
    const res = await query(sql);
    return res.rows[0];
  }
}

export default new AnomalyRepository();

