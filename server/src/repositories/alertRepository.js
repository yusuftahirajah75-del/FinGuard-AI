import { query } from '../config/database.js';

export class AlertRepository {
  /**
   * Persist a new alert or return existing if duplicate
   */
  async create(data) {
    const sql = `
      INSERT INTO alerts (
        id, transaction_id, anomaly_result_id, severity, status,
        assigned_analyst, investigation_notes, created_at, updated_at
      ) VALUES (
        COALESCE($1, gen_random_uuid()), $2, $3, $4, COALESCE($5, 'OPEN'),
        $6, $7, NOW(), NOW()
      )
      ON CONFLICT (transaction_id, anomaly_result_id) 
      DO UPDATE SET updated_at = NOW()
      RETURNING *
    `;

    const params = [
      data.id || null,
      data.transaction_id,
      data.anomaly_result_id,
      data.severity,
      data.status || 'OPEN',
      data.assigned_analyst || null,
      data.investigation_notes || null,
    ];

    const res = await query(sql, params);
    return res.rows[0];
  }

  /**
   * Find alert by UUID
   */
  async findById(id) {
    const sql = `
      SELECT al.*, 
             t.transaction_reference, t.customer_reference, t.amount, t.currency,
             t.transaction_timestamp, t.transaction_channel, t.beneficiary_reference,
             ar.anomaly_score, ar.risk_level, ar.signal_results, ar.explanation, ar.algorithm_version
      FROM alerts al
      JOIN transactions t ON t.id = al.transaction_id
      JOIN anomaly_results ar ON ar.id = al.anomaly_result_id
      WHERE al.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Check if alert exists for transaction
   */
  async findByTransactionAndResult(transactionId, anomalyResultId) {
    const sql = `
      SELECT * FROM alerts 
      WHERE transaction_id = $1 AND anomaly_result_id = $2
    `;
    const res = await query(sql, [transactionId, anomalyResultId]);
    return res.rows[0] || null;
  }

  /**
   * Paginated alerts with filters
   */
  async findPaginated(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      severity,
      assignedAnalyst,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (status) {
      conditions.push(`al.status = $${pIdx++}`);
      params.push(status.toUpperCase());
    }

    if (severity) {
      conditions.push(`al.severity = $${pIdx++}`);
      params.push(severity.toUpperCase());
    }

    if (assignedAnalyst) {
      conditions.push(`al.assigned_analyst ILIKE $${pIdx++}`);
      params.push(`%${assignedAnalyst}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortColumns = {
      created_at: 'al.created_at',
      updated_at: 'al.updated_at',
      severity: 'al.severity',
      status: 'al.status',
      score: 'ar.anomaly_score',
      amount: 't.amount',
    };

    const sortColumn = allowedSortColumns[sortBy.toLowerCase()] || 'al.created_at';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(*) as total
      FROM alerts al
      JOIN transactions t ON t.id = al.transaction_id
      JOIN anomaly_results ar ON ar.id = al.anomaly_result_id
      ${whereClause}
    `;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const offset = (Math.max(1, page) - 1) * limit;
    const dataSql = `
      SELECT al.*, 
             t.transaction_reference, t.customer_reference, t.amount, t.currency,
             t.transaction_timestamp, t.transaction_channel, t.beneficiary_reference,
             ar.anomaly_score, ar.risk_level, ar.explanation
      FROM alerts al
      JOIN transactions t ON t.id = al.transaction_id
      JOIN anomaly_results ar ON ar.id = al.anomaly_result_id
      ${whereClause}
      ORDER BY ${sortColumn} ${direction}
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    const dataParams = [...params, limit, offset];
    const dataRes = await query(dataSql, dataParams);

    return {
      items: dataRes.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update alert fields
   */
  async update(id, data) {
    const fields = [];
    const params = [];
    let pIdx = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${pIdx++}`);
      params.push(data.status);
    }

    if (data.assigned_analyst !== undefined) {
      fields.push(`assigned_analyst = $${pIdx++}`);
      params.push(data.assigned_analyst);
    }

    if (data.investigation_notes !== undefined) {
      fields.push(`investigation_notes = $${pIdx++}`);
      params.push(data.investigation_notes);
    }

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const sql = `
      UPDATE alerts
      SET ${fields.join(', ')}
      WHERE id = $${pIdx}
      RETURNING *
    `;

    const res = await query(sql, params);
    return res.rows[0] || null;
  }

  /**
   * Alert counts by status
   */
  async getStatusBreakdown() {
    const sql = `
      SELECT status, COUNT(*) as count
      FROM alerts
      GROUP BY status
    `;
    const res = await query(sql);
    return res.rows;
  }

  /**
   * Alert counts by severity
   */
  async getSeverityBreakdown() {
    const sql = `
      SELECT severity, COUNT(*) as count
      FROM alerts
      GROUP BY severity
    `;
    const res = await query(sql);
    return res.rows;
  }
}

export default new AlertRepository();

