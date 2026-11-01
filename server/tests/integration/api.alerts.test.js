import request from 'supertest';
import app from '../../src/app.js';
import { query } from '../../src/config/database.js';

describe('API: Alerts & Audit Logs Endpoints', () => {
  let sampleAlertId;

  beforeAll(async () => {
    const alertRes = await query('SELECT id FROM alerts LIMIT 1');
    if (alertRes.rows.length > 0) {
      sampleAlertId = alertRes.rows[0].id;
    } else {
      const txRes = await query(
        "SELECT id FROM transactions WHERE synthetic_ground_truth_label = 'SUSPICIOUS' LIMIT 1"
      );
      if (txRes.rows.length > 0) {
        const analyzeRes = await request(app).post(`/api/detection/analyze/${txRes.rows[0].id}`);
        if (analyzeRes.body.data?.alert?.id) {
          sampleAlertId = analyzeRes.body.data.alert.id;
        }
      }
    }
  });

  test('GET /api/alerts returns paginated list of alerts', async () => {
    const res = await request(app).get('/api/alerts?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  test('GET /api/alerts/:id returns alert details and audit log history', async () => {
    if (!sampleAlertId) return;

    const res = await request(app).get(`/api/alerts/${sampleAlertId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(sampleAlertId);
    expect(res.body.data.transaction_reference).toBeDefined();
    expect(res.body.data.anomaly_score).toBeDefined();
    expect(Array.isArray(res.body.data.auditLogs)).toBe(true);
  });

  test('PATCH /api/alerts/:id updates status, analyst, notes and writes audit log', async () => {
    if (!sampleAlertId) return;

    const updatePayload = {
      status: 'UNDER_REVIEW',
      assigned_analyst: 'Senior Analyst Sarah Jenkins',
      investigation_notes: 'Initial triage complete. Contacting cardholder regarding unusual offshore transfer.',
      actor_reference: 'analyst-sjenkins',
    };

    const patchRes = await request(app)
      .patch(`/api/alerts/${sampleAlertId}`)
      .send(updatePayload);

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.data.status).toBe('UNDER_REVIEW');
    expect(patchRes.body.data.assigned_analyst).toBe('Senior Analyst Sarah Jenkins');

    // Verify audit log has the update entry
    const getRes = await request(app).get(`/api/alerts/${sampleAlertId}`);
    expect(getRes.statusCode).toBe(200);
    const logs = getRes.body.data.auditLogs;
    expect(logs.length).toBeGreaterThanOrEqual(1);

    const latestLog = logs[logs.length - 1];
    expect(latestLog.actor_reference).toBe('analyst-sjenkins');
    expect(latestLog.new_value.status).toBe('UNDER_REVIEW');
  });

  test('PATCH /api/alerts/:id rejects invalid status transition', async () => {
    if (!sampleAlertId) return;

    const invalidPayload = {
      status: 'INVALID_STATUS',
    };

    const res = await request(app)
      .patch(`/api/alerts/${sampleAlertId}`)
      .send(invalidPayload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
