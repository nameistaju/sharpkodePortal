import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

const rateLimitHandler = (name) => (req, res) => {
  logger.warn('rate_limit_exceeded', {
    limiter: name,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userId: req.user?._id?.toString()
  });

  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later'
  });
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('api')
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler('login')
});

export const authSensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('auth_sensitive')
});

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('write')
});

export const attendanceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('attendance')
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('upload')
});
