import { query } from '../config/database.js';

export class AuditLogRepository {
  /**
   * Insert audit log entry
   */
  async create(data) {
    const sql = `
      INSERT INTO audit_logs (
        id, alert_id, action, previous_value, new_value, actor_reference, created_at
      ) VALUES (
        COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, COALESCE($6, 'system'), NOW()
      )
      RETURNING *
    `;

    const params = [
      data.id || null,
      data.alert_id,
      data.action,
      data.previous_value ? JSON.stringify(data.previous_value) : null,
      data.new_value ? JSON.stringify(data.new_value) : null,
      data.actor_reference || 'system',
    ];

    const res = await query(sql, params);
    return res.rows[0];
  }

  /**
   * Find audit history for a specific alert
   */
  async findByAlertId(alertId) {
    const sql = `
      SELECT * FROM audit_logs
      WHERE alert_id = $1
      ORDER BY created_at ASC
    `;
    const res = await query(sql, [alertId]);
    return res.rows;
  }
}

export default new AuditLogRepository();

