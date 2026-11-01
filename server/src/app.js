import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from './config/config.js';
import apiRateLimiter from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import logger from './utils/logger.js';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin '${origin}' not allowed by CORS policy`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
};
app.use(cors(corsOptions));

// Rate Limiting
app.use('/api', apiRateLimiter);

// Body Parsers with safe payload size restrictions
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request Logging Middleware (disabled in unit/integration test mode)
if (!config.isTest) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
    });
    next();
  });
}

// Mount API routes
app.use(config.API_PREFIX, apiRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Financial Transaction Anomaly Detection System (FTADS) API',
    version: config.ALGORITHM_VERSION,
    status: 'ACTIVE',
    documentation: '/api/detection/methodology',
    healthCheck: '/api/health',
  });
});

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;

