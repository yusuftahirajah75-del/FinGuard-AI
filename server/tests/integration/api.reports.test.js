import request from 'supertest';
import app from '../../src/app.js';

describe('API: Reports & Academic Analytics Endpoints', () => {
  beforeAll(async () => {
    // Analyze a batch of transactions to ensure evaluation numbers exist
    await request(app).post('/api/detection/analyze-batch').send({
      limit: 25,
      onlyUnanalyzed: false,
    });
  });

  test('GET /api/reports/summary returns system operational metrics', async () => {
    const res = await request(app).get('/api/reports/summary');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactions).toBeDefined();
    expect(res.body.data.detection).toBeDefined();
    expect(res.body.data.alerts).toBeDefined();
    expect(res.body.data.transactions.total).toBeGreaterThan(0);
  });

  test('GET /api/reports/confusion-matrix calculates academic evaluation metrics', async () => {
    const res = await request(app).get('/api/reports/confusion-matrix?threshold=60');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.confusionMatrix).toBeDefined();
    expect(typeof data.confusionMatrix.truePositives).toBe('number');
    expect(typeof data.confusionMatrix.falsePositives).toBe('number');
    expect(typeof data.confusionMatrix.trueNegatives).toBe('number');
    expect(typeof data.confusionMatrix.falseNegatives).toBe('number');

    expect(data.metrics).toBeDefined();
    expect(typeof data.metrics.precision).toBe('number');
    expect(typeof data.metrics.recall).toBe('number');
    expect(typeof data.metrics.f1Score).toBe('number');
    expect(typeof data.metrics.accuracy).toBe('number');

    // Bounds check
    expect(data.metrics.precision).toBeGreaterThanOrEqual(0);
    expect(data.metrics.precision).toBeLessThanOrEqual(1);
    expect(data.metrics.recall).toBeGreaterThanOrEqual(0);
    expect(data.metrics.recall).toBeLessThanOrEqual(1);
    expect(data.metrics.f1Score).toBeGreaterThanOrEqual(0);
    expect(data.metrics.f1Score).toBeLessThanOrEqual(1);
    expect(data.metrics.accuracy).toBeGreaterThanOrEqual(0);
    expect(data.metrics.accuracy).toBeLessThanOrEqual(1);
  });

  test('GET /api/reports/export downloads sanitized CSV format', async () => {
    const res = await request(app).get('/api/reports/export?type=transactions&limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('transaction_reference');
    expect(res.text).toContain('amount');
  });

  test('GET /api/reports/export downloads alerts CSV format', async () => {
    const res = await request(app).get('/api/reports/export?type=alerts&limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
  });
});
