const pool = require('../config/database');
const { sendRFPNotificationEmail } = require('../services/emailService');

const createRFP = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { product_ids, message } = req.body;
    const userId = req.user.id;

    if (!product_ids || product_ids.length === 0) {
      return res.status(400).json({ error: 'At least one product must be selected' });
    }

    await client.query('BEGIN');

    const rfpResult = await client.query(
      'INSERT INTO rfps (user_id, message, status) VALUES ($1, $2, $3) RETURNING id',
      [userId, message || '', 'New']
    );

    const rfpId = rfpResult.rows[0].id;

    for (const productId of product_ids) {
      await client.query(
        'INSERT INTO rfp_items (rfp_id, product_id) VALUES ($1, $2)',
        [rfpId, productId]
      );
    }

    await client.query('COMMIT');

    const adminResult = await client.query(
      "SELECT email FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (adminResult.rows.length > 0) {
      await sendRFPNotificationEmail(
        adminResult.rows[0].email,
        req.user.name,
        req.user.company,
        product_ids.length
      );
    }

    res.status(201).json({
      message: 'RFP submitted successfully',
      rfp_id: rfpId,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create RFP error:', error);
    res.status(500).json({ error: 'Failed to create RFP' });
  } finally {
    client.release();
  }
};

const getUserRFPs = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT r.id, r.status, r.message, r.created_at,
              json_agg(json_build_object('id', p.id, 'name', p.name, 'image_url', p.image_url)) as products
       FROM rfps r
       LEFT JOIN rfp_items ri ON r.id = ri.rfp_id
       LEFT JOIN products p ON ri.product_id = p.id
       WHERE r.user_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user RFPs error:', error);
    res.status(500).json({ error: 'Failed to fetch RFPs' });
  }
};

module.exports = {
  createRFP,
  getUserRFPs,
};
