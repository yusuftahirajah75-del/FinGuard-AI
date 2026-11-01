import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, pool } from '../config/database.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  logger.info(`Starting database migrations on database '${config.activeDbName}'...`);
  const migrationsDir = path.resolve(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    logger.info(`Applying migration: ${file}`);
    const sql = fs.readFileSync(filePath, 'utf-8');
    await query(sql);
    logger.info(`Successfully applied migration: ${file}`);
  }

  logger.info('All database migrations applied successfully.');
}

// Allow standalone execution via `npm run migrate`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(async () => {
      logger.info('Migration process finished.');
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Migration failed:', { error: err.message, stack: err.stack });
      await pool.end();
      process.exit(1);
    });
}

