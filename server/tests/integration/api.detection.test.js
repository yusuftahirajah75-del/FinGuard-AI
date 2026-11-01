import request from 'supertest';
import app from '../../src/app.js';
import { query } from '../../src/config/database.js';

describe('API: Detection Endpoints', () => {
  let sampleTxId;

  beforeAll(async () => {
    const res = await query('SELECT id FROM transactions LIMIT 1');
    if (res.rows.length > 0) {
      sampleTxId = res.rows[0].id;
    }
  });

  test('GET /api/detection/methodology returns complete specification', async () => {
    const res = await request(app).get('/api/detection/methodology');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.system).toBeDefined();
    expect(res.body.data.detectors).toHaveLength(5);
    expect(res.body.data.scoring).toBeDefined();
  });

  test('GET /api/detection/settings returns current configuration', async () => {
    const res = await request(app).get('/api/detection/settings');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.weights).toBeDefined();
    expect(res.body.data.thresholds).toBeDefined();
  });

  test('PATCH /api/detection/settings updates settings with validation', async () => {
    const updatePayload = {
      weights: {
        amount: 0.30,
        velocity: 0.30,
        unusual_time: 0.15,
        repeated_transaction: 0.15,
        new_beneficiary: 0.10, // sums to 1.0
      },
      description: 'Updated academic testing weights',
    };

    const res = await request(app).patch('/api/detection/settings').send(updatePayload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.weights.amount).toBe(0.30);
    expect(res.body.data.description).toBe('Updated academic testing weights');
  });

  test('POST /api/detection/analyze/:id analyzes transaction and returns signals', async () => {
    if (!sampleTxId) return;

    const res = await request(app).post(`/api/detection/analyze/${sampleTxId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactionId).toBe(sampleTxId);
    expect(typeof res.body.data.anomalyScore).toBe('number');
    expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(res.body.data.riskLevel);
    expect(res.body.data.signals).toBeDefined();
    expect(res.body.data.explanation).toBeDefined();
    expect(res.body.data.algorithmVersion).toBeDefined();
  });

  test('POST /api/detection/analyze/:id prevents duplicate alert creation on re-analysis', async () => {
    if (!sampleTxId) return;

    // Run first analysis
    await request(app).post(`/api/detection/analyze/${sampleTxId}`);

    // Count alerts before second run
    const countBefore = await query(
      'SELECT COUNT(*) as count FROM alerts WHERE transaction_id = $1',
      [sampleTxId]
    );

    // Run second analysis on same transaction
    const res2 = await request(app).post(`/api/detection/analyze/${sampleTxId}`);
    expect(res2.statusCode).toBe(200);

    // Count alerts after second run
    const countAfter = await query(
      'SELECT COUNT(*) as count FROM alerts WHERE transaction_id = $1',
      [sampleTxId]
    );

    expect(countAfter.rows[0].count).toBe(countBefore.rows[0].count);
  });

  test('GET /api/detection/results/:transactionId retrieves stored analysis', async () => {
    if (!sampleTxId) return;

    const res = await request(app).get(`/api/detection/results/${sampleTxId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction_id).toBe(sampleTxId);
    expect(res.body.data.anomaly_score).toBeDefined();
  });

  test('POST /api/detection/analyze-batch executes batch detection', async () => {
    const res = await request(app).post('/api/detection/analyze-batch').send({
      limit: 10,
      onlyUnanalyzed: false,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalProcessed).toBeGreaterThanOrEqual(1);
    expect(res.body.data.durationMs).toBeDefined();
  });
});
