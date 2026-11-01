import request from 'supertest';
import app from '../../src/app.js';

describe('API: Health Check Endpoint', () => {
  test('GET /api/health returns 200 and operational status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.database.connected).toBe(true);
    expect(res.body.data.version).toBeDefined();
    expect(res.body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
