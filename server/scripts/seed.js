import { query, pool } from '../src/config/database.js';
import { runMigrations } from '../src/database/migrate.js';
import { generateSyntheticTransactions } from '../src/database/seeds/syntheticGenerator.js';
import logger from '../src/utils/logger.js';
import config from '../src/config/config.js';

export async function seedDatabase(options = {}) {
  const force = options.force || process.argv.includes('--force');
  logger.info(`Seeding synthetic dataset on database: '${config.activeDbName}'...`);

  // Ensure migrations are run first
  await runMigrations();

  // Check if data already exists
  const existingRes = await query('SELECT COUNT(*) as count FROM transactions');
  const count = parseInt(existingRes.rows[0].count, 10);

  if (count > 0 && !force) {
    logger.warn(`Database already contains ${count} transactions. Use --force to reseed.`);
    return { seeded: false, count };
  }

  if (force && count > 0) {
    logger.info(`Truncating existing transactions and associated tables (--force specified)...`);
    await query('TRUNCATE TABLE audit_logs, alerts, anomaly_results, transactions CASCADE');
  }

  const transactions = generateSyntheticTransactions({ count: 1000, seed: 424242 });
  logger.info(`Generated ${transactions.length} synthetic transactions with ground truth labels.`);

  // Insert in chunks of 100 transactions using parameterized multi-row INSERT
  const chunkSize = 100;
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);

    const values = [];
    const valuePlaceholders = [];
    let pIdx = 1;

    for (const t of chunk) {
      valuePlaceholders.push(
        `($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`
      );
      values.push(
        t.id,
        t.transaction_reference,
        t.customer_reference,
        t.source_account_reference,
        t.beneficiary_reference,
        t.amount,
        t.currency,
        t.transaction_type,
        t.transaction_channel,
        t.transaction_location,
        t.transaction_timestamp,
        t.transaction_status,
        t.synthetic_ground_truth_label
      );
    }

    const insertSql = `
      INSERT INTO transactions (
        id, transaction_reference, customer_reference, source_account_reference,
        beneficiary_reference, amount, currency, transaction_type, transaction_channel,
        transaction_location, transaction_timestamp, transaction_status, synthetic_ground_truth_label
      ) VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (transaction_reference) DO NOTHING
    `;

    await query(insertSql, values);
  }

  const finalRes = await query('SELECT COUNT(*) as count, synthetic_ground_truth_label FROM transactions GROUP BY synthetic_ground_truth_label');
  logger.info('Database seeded successfully. Breakdown by ground-truth label:', { breakdown: finalRes.rows });

  return { seeded: true, total: transactions.length, breakdown: finalRes.rows };
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      logger.info('Seeding finished.');
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Seeding failed:', { error: err.message, stack: err.stack });
      await pool.end();
      process.exit(1);
    });
}
