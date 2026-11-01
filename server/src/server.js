import app from './app.js';
import config from './config/config.js';
import { testConnection, closePool } from './config/database.js';
import logger from './utils/logger.js';

const PORT = config.PORT || 5000;

async function startServer() {
  logger.info(`Starting FTADS Server in [${config.NODE_ENV}] mode...`);

  // Verify database connectivity
  const dbHealth = await testConnection();
  if (!dbHealth.connected) {
    logger.error(`PostgreSQL connection failed: ${dbHealth.error}`);
    logger.error('Ensure PostgreSQL service is running and credentials in .env are correct.');
    process.exit(1);
  }

  logger.info(`Database connected: '${dbHealth.database}' on port ${config.DB_PORT}`);

  const server = app.listen(PORT, () => {
    logger.info(`================================================================`);
    logger.info(`FTADS Backend API & Detection Engine is live`);
    logger.info(`Listening on: http://localhost:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
    logger.info(`Dashboard:    http://localhost:${PORT}/api/dashboard/summary`);
    logger.info(`Methodology:  http://localhost:${PORT}/api/detection/methodology`);
    logger.info(`================================================================`);
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down FTADS server gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await closePool();
        logger.info('PostgreSQL connection pool closed.');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing database pool:', { error: err.message });
        process.exit(1);
      }
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forcefully terminating process due to shutdown timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer().catch((err) => {
  logger.error('Fatal initialization error:', { error: err.message, stack: err.stack });
  process.exit(1);
});

