import rateLimit from 'express-rate-limit';
import config from '../config/config.js';

export const apiRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.isTest ? 100000 : config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please retry later.',
  },
});

export default apiRateLimiter;
