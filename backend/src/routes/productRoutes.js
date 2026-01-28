const express = require('express');
const router = express.Router();
const { getProducts, getProduct } = require('../controllers/productController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, getProducts);
router.get('/:id', authMiddleware, getProduct);

module.exports = router;
