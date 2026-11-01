import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root or server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api'),
  
  // Database configuration
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('ftads_dev'),
  TEST_DB_NAME: z.string().default('ftads_test'),
  DB_SSL: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
  DATABASE_URL: z.string().optional(),

  // Security & Limits
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173,http://localhost:8080'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(1000),

  // Anomaly Detection Core
  ALGORITHM_VERSION: z.string().default('1.0.0'),
  ANOMALY_ALERT_THRESHOLD: z.coerce.number().min(0).max(100).default(60.0),

  // Demo Safeguards
  DEMO_MODE: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(true)),
  ALLOW_DEMO_RESEED: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(true)),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration validation failure');
}

export const config = {
  ...parsed.data,
  isTest: parsed.data.NODE_ENV === 'test',
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  activeDbName: parsed.data.NODE_ENV === 'test' ? parsed.data.TEST_DB_NAME : parsed.data.DB_NAME,
};

export default config;
