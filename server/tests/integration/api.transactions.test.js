import request from 'supertest';
import app from '../../src/app.js';
import { query } from '../../src/config/database.js';

describe('API: Transactions Endpoints', () => {
  let sampleTxId;

  beforeAll(async () => {
    const res = await query('SELECT id FROM transactions LIMIT 1');
    if (res.rows.length > 0) {
      sampleTxId = res.rows[0].id;
    }
  });

  test('GET /api/transactions returns paginated list with metadata', async () => {
    const res = await request(app).get('/api/transactions?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  test('GET /api/transactions/:id returns transaction details', async () => {
    if (!sampleTxId) return;
    const res = await request(app).get(`/api/transactions/${sampleTxId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(sampleTxId);
    expect(res.body.data.amount).toBeDefined();
    expect(res.body.data.customer_reference).toBeDefined();
  });

  test('GET /api/transactions/:id returns 404 for non-existent UUID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).get(`/api/transactions/${nonExistentId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/transactions creates transaction with valid payload', async () => {
    const payload = {
      customer_reference: 'CUST-TEST-0099',
      source_account_reference: 'ACC-TEST-0099',
      beneficiary_reference: 'BEN-TEST-0099',
      amount: 450.75,
      currency: 'USD',
      transaction_type: 'TRANSFER',
      transaction_channel: 'ONLINE',
      transaction_location: 'New York, US',
      transaction_status: 'COMPLETED',
    };

    const res = await request(app).post('/api/transactions').send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customer_reference).toBe('CUST-TEST-0099');
    expect(Number(res.body.data.amount)).toBe(450.75);
    expect(res.body.data.transaction_reference).toBeDefined();
  });

  test('POST /api/transactions returns 400 when validation fails', async () => {
    const invalidPayload = {
      amount: -100,
      transaction_type: 'INVALID_TYPE',
    };

    const res = await request(app).post('/api/transactions').send(invalidPayload);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });
});
