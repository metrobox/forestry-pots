const express = require('express');
const router = express.Router();
const {
  login,
  requestAccess,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, login);
router.post('/request-access', requestAccess);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
