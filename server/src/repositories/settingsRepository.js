import { query } from '../config/database.js';

export class SettingsRepository {
  /**
   * Retrieve active detection settings
   */
  async getSettings(id = 'default') {
    const sql = 'SELECT * FROM detection_settings WHERE id = $1';
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Update weights and thresholds
   */
  async updateSettings(id = 'default', data = {}) {
    const fields = [];
    const params = [];
    let pIdx = 1;

    if (data.weights !== undefined) {
      fields.push(`weights = $${pIdx++}`);
      params.push(JSON.stringify(data.weights));
    }

    if (data.thresholds !== undefined) {
      fields.push(`thresholds = $${pIdx++}`);
      params.push(JSON.stringify(data.thresholds));
    }

    if (data.description !== undefined) {
      fields.push(`description = $${pIdx++}`);
      params.push(data.description);
    }

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const sql = `
      UPDATE detection_settings
      SET ${fields.join(', ')}
      WHERE id = $${pIdx}
      RETURNING *
    `;

    const res = await query(sql, params);
    return res.rows[0] || null;
  }
}

export default new SettingsRepository();
