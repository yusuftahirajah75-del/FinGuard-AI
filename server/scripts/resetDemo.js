import { query, pool } from '../src/config/database.js';
import { runMigrations } from '../src/database/migrate.js';
import { seedDatabase } from './seed.js';
import config from '../src/config/config.js';
import logger from '../src/utils/logger.js';

export async function resetDemoDatabase() {
  logger.info('Initiating FTADS Demo Environment Reset & Reseed...');

  // 1. Strict Safeguard Checks
  if (config.isProd) {
    throw new Error('SECURITY VIOLATION: Demo reset is permanently disabled in production environments!');
  }

  if (!config.DEMO_MODE) {
    throw new Error('DEMO SAFEGUARD: DEMO_MODE is set to false in configuration. Reset rejected.');
  }

  if (!config.ALLOW_DEMO_RESEED) {
    throw new Error('DEMO SAFEGUARD: ALLOW_DEMO_RESEED is set to false. Reset rejected.');
  }

  // Ensure DB name is safe
  const dbName = config.activeDbName.toLowerCase();
  const isSafeName = dbName.includes('dev') || dbName.includes('test') || dbName.includes('demo');
  if (!isSafeName) {
    throw new Error(`SECURITY SAFEGUARD: Target database '${config.activeDbName}' does not appear to be a dev/test/demo database.`);
  }

  logger.warn(`Safeguards passed. Ensuring schema and reseeding database '${config.activeDbName}'...`);

  // Ensure migrations are run first so tables exist
  await runMigrations();

  // Truncate all tables
  await query('TRUNCATE TABLE audit_logs, alerts, anomaly_results, transactions CASCADE');
  logger.info('Existing tables truncated.');

  // Seed fresh 1,000 transactions
  const seedResult = await seedDatabase({ force: true });
  logger.info('Demo database re-seeded successfully.', seedResult);

  return seedResult;
}

if (process.argv[1] && process.argv[1].endsWith('resetDemo.js')) {
  resetDemoDatabase()
    .then(async () => {
      logger.info('Demo reset completed successfully.');
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Demo reset failed:', { error: err.message });
      await pool.end();
      process.exit(1);
    });
}
