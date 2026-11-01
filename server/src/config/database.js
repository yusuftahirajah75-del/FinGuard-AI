import pg from 'pg';
import config from './config.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

const poolConfig = config.DATABASE_URL
  ? {
      connectionString: config.DATABASE_URL,
      ssl: config.DB_SSL ? { rejectUnauthorized: false } : false,
    }
  : {
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.activeDbName,
      ssl: config.DB_SSL ? { rejectUnauthorized: false } : false,
      max: config.isTest ? 5 : 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client pool', { error: err.message });
});

/**
 * Execute parameterized query
 * @param {string} text - SQL statement
 * @param {Array<any>} params - Parameterized query arguments
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.isDev && duration > 100) {
      logger.debug('Slow query detected', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    logger.error('Database query execution error', { text, error: error.message });
    throw error;
  }
}

/**
 * Run callback within a managed database transaction
 * @param {Function} callback - Async function receiving client
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back due to error', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check verification
 */
export async function testConnection() {
  try {
    const res = await query('SELECT NOW() as current_time, current_database() as database');
    return {
      connected: true,
      database: res.rows[0].database,
      serverTime: res.rows[0].current_time,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
}

/**
 * Close pool gracefully
 */
export async function closePool() {
  await pool.end();
}

export default {
  pool,
  query,
  withTransaction,
  testConnection,
  closePool,
};

