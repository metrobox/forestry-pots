const pool = require('../config/database');
const path = require('path');
const fs = require('fs').promises;
const { createWatermarkedFile } = require('../utils/watermark');

const logFileAccess = async (userId, productId, fileType, action, req, watermarkId = null, result = 'success') => {
  try {
    await pool.query(
      `INSERT INTO file_access_logs (user_id, product_id, file_type, action, ip_address, user_agent, watermark_id, result)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        productId,
        fileType,
        action,
        req.ip || req.connection.remoteAddress,
        req.get('user-agent'),
        watermarkId,
        result
      ]
    );
  } catch (error) {
    console.error('Log file access error:', error);
  }
};

const downloadFile = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { productId, type } = req.params;
    const userId = req.user.id;

    const productResult = await client.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      await logFileAccess(userId, productId, type, 'download', req, null, 'product_not_found');
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];
    let fileUrl;

    if (type === 'pdf') {
      fileUrl = product.pdf_url;
    } else if (type === 'image') {
      fileUrl = product.image_url;
    } else if (type === 'dwg') {
      fileUrl = product.dwg_url;
    } else {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    if (!fileUrl) {
      await logFileAccess(userId, productId, type, 'download', req, null, 'file_not_available');
      return res.status(404).json({ error: 'File not available' });
    }

    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', fileUrl);

    try {
      await fs.access(filePath);
    } catch (error) {
      await logFileAccess(userId, productId, type, 'download', req, null, 'file_not_found');
      return res.status(404).json({ error: 'File not found' });
    }

    const userResult = await client.query(
      'SELECT name, company FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    if (type === 'pdf' || type === 'image') {
      const watermarked = await createWatermarkedFile(
        filePath,
        type,
        user.name,
        user.company,
        product.name
      );

      const watermarkResult = await client.query(
        `INSERT INTO watermarks (user_id, product_id, file_type, watermark_text, file_path)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userId, productId, type, watermarked.watermarkText, watermarked.path]
      );

      const watermarkId = watermarkResult.rows[0].id;
      await logFileAccess(userId, productId, type, 'download', req, watermarkId, 'success');

      const ext = path.extname(filePath);
      const filename = `${product.name.replace(/[^a-z0-9]/gi, '_')}_${user.company.replace(/[^a-z0-9]/gi, '_')}_${watermarked.downloadId}${ext}`;

      res.download(watermarked.path, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
      });
    } else if (type === 'dwg') {
      await logFileAccess(userId, productId, type, 'download', req, null, 'success');

      const ext = path.extname(filePath);
      const filename = `${product.name.replace(/[^a-z0-9]/gi, '_')}_${user.company.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}${ext}`;

      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
      });
    }
  } catch (error) {
    console.error('Download file error:', error);
    await logFileAccess(req.user.id, req.params.productId, req.params.type, 'download', req, null, 'error');
    res.status(500).json({ error: 'Failed to download file' });
  } finally {
    client.release();
  }
};

module.exports = {
  downloadFile,
};
