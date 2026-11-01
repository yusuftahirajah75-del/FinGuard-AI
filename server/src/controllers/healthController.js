import { testConnection } from '../config/database.js';
import config from '../config/config.js';

export async function getHealth(req, res, next) {
  try {
    const dbStatus = await testConnection();
    const isHealthy = dbStatus.connected;

    const payload = {
      status: isHealthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.NODE_ENV,
      version: config.ALGORITHM_VERSION,
      database: dbStatus,
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      },
    };

    return res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: isHealthy ? 'FTADS service operational' : 'Database connection unavailable',
      data: payload,
    });
  } catch (error) {
    next(error);
  }
}

export default { getHealth };

