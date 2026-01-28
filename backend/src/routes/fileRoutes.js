const express = require('express');
const router = express.Router();
const { downloadFile } = require('../controllers/fileController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:productId/:type/download', authMiddleware, downloadFile);

module.exports = router;
