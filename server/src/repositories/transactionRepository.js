import { query } from '../config/database.js';

export class TransactionRepository {
  /**
   * Find transaction by primary UUID
   */
  async findById(id) {
    const sql = `
      SELECT t.*, ar.anomaly_score, ar.risk_level, ar.id as anomaly_result_id,
             al.id as alert_id, al.status as alert_status, al.severity as alert_severity
      FROM transactions t
      LEFT JOIN anomaly_results ar ON ar.transaction_id = t.id
      LEFT JOIN alerts al ON al.transaction_id = t.id
      WHERE t.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Find transaction by unique reference
   */
  async findByReference(reference) {
    const sql = 'SELECT * FROM transactions WHERE transaction_reference = $1';
    const res = await query(sql, [reference]);
    return res.rows[0] || null;
  }

  /**
   * Retrieve strictly prior historical transactions for a customer to prevent data leakage.
   * Sorted descending by timestamp.
   */
  async findCustomerHistory(customerReference, beforeTimestamp, limit = 500) {
    const sql = `
      SELECT id, transaction_reference, customer_reference, source_account_reference,
             beneficiary_reference, amount, currency, transaction_type, transaction_channel,
             transaction_location, transaction_timestamp, transaction_status
      FROM transactions
      WHERE customer_reference = $1
        AND transaction_timestamp < $2
      ORDER BY transaction_timestamp DESC
      LIMIT $3
    `;
    const res = await query(sql, [customerReference, beforeTimestamp, limit]);
    return res.rows;
  }

  /**
   * Find paginated transactions with filtering and sorting.
   */
  async findPaginated(options = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      channel,
      status,
      riskLevel,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sortBy = 'transaction_timestamp',
      sortOrder = 'DESC',
    } = options;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(
        t.transaction_reference ILIKE $${pIdx} OR 
        t.customer_reference ILIKE $${pIdx} OR 
        t.beneficiary_reference ILIKE $${pIdx}
      )`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (channel) {
      conditions.push(`t.transaction_channel = $${pIdx++}`);
      params.push(channel.toUpperCase());
    }

    if (status) {
      conditions.push(`t.transaction_status = $${pIdx++}`);
      params.push(status.toUpperCase());
    }

    if (riskLevel) {
      conditions.push(`ar.risk_level = $${pIdx++}`);
      params.push(riskLevel.toUpperCase());
    }

    if (minAmount !== undefined && minAmount !== null) {
      conditions.push(`t.amount >= $${pIdx++}`);
      params.push(minAmount);
    }

    if (maxAmount !== undefined && maxAmount !== null) {
      conditions.push(`t.amount <= $${pIdx++}`);
      params.push(maxAmount);
    }

    if (startDate) {
      conditions.push(`t.transaction_timestamp >= $${pIdx++}`);
      params.push(new Date(startDate));
    }

    if (endDate) {
      conditions.push(`t.transaction_timestamp <= $${pIdx++}`);
      params.push(new Date(endDate));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Allowed sort columns
    const allowedSortColumns = {
      timestamp: 't.transaction_timestamp',
      transaction_timestamp: 't.transaction_timestamp',
      amount: 't.amount',
      reference: 't.transaction_reference',
      customer: 't.customer_reference',
      score: 'ar.anomaly_score',
      anomaly_score: 'ar.anomaly_score',
    };

    const sortColumn = allowedSortColumns[sortBy.toLowerCase()] || 't.transaction_timestamp';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM transactions t
      LEFT JOIN anomaly_results ar ON ar.transaction_id = t.id
      ${whereClause}
    `;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    // Data query with offset & limit
    const offset = (Math.max(1, page) - 1) * limit;
    const dataSql = `
      SELECT t.*, ar.anomaly_score, ar.risk_level, ar.id as anomaly_result_id,
             al.id as alert_id, al.status as alert_status, al.severity as alert_severity
      FROM transactions t
      LEFT JOIN anomaly_results ar ON ar.transaction_id = t.id
      LEFT JOIN alerts al ON al.transaction_id = t.id
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
   * Create a new transaction record
   */
  async create(data) {
    const sql = `
      INSERT INTO transactions (
        id, transaction_reference, customer_reference, source_account_reference,
        beneficiary_reference, amount, currency, transaction_type, transaction_channel,
        transaction_location, transaction_timestamp, transaction_status, synthetic_ground_truth_label
      ) VALUES (
        COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING *
    `;

    const params = [
      data.id || null,
      data.transaction_reference,
      data.customer_reference,
      data.source_account_reference,
      data.beneficiary_reference,
      data.amount,
      data.currency || 'USD',
      data.transaction_type,
      data.transaction_channel,
      data.transaction_location || null,
      data.transaction_timestamp || new Date().toISOString(),
      data.transaction_status || 'COMPLETED',
      data.synthetic_ground_truth_label || 'NORMAL',
    ];

    const res = await query(sql, params);
    return res.rows[0];
  }

  /**
   * Count total transactions in table
   */
  async countAll() {
    const res = await query('SELECT COUNT(*) as count FROM transactions');
    return parseInt(res.rows[0].count, 10);
  }
}

export default new TransactionRepository();

