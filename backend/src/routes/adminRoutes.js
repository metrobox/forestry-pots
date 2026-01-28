const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllRFPs,
  updateRFPStatus,
  getAccessLogs,
  getAccessRequests,
  upload,
} = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/products', getAllProducts);
router.post('/products', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'pdfFile', maxCount: 1 },
  { name: 'dwgFile', maxCount: 1 },
  { name: 'textures', maxCount: 10 }
]), createProduct);
router.put('/products/:id', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'pdfFile', maxCount: 1 },
  { name: 'dwgFile', maxCount: 1 },
  { name: 'textures', maxCount: 10 }
]), updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/rfps', getAllRFPs);
router.put('/rfps/:id/status', updateRFPStatus);

router.get('/access-logs', getAccessLogs);
router.get('/access-requests', getAccessRequests);

module.exports = router;
