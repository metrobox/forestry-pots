const express = require('express');
const router = express.Router();
const { createRFP, getUserRFPs } = require('../controllers/rfpController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, createRFP);
router.get('/my-rfps', authMiddleware, getUserRFPs);

module.exports = router;
