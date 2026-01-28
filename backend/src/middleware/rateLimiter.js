const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const loginLimiter = createRateLimiter(15 * 60 * 1000, 15, 'Too many login attempts, please try again later');

const apiLimiter = createRateLimiter();

module.exports = { createRateLimiter, loginLimiter, apiLimiter };
