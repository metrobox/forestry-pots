const pool = require('../config/database');
const { hashPassword, generateRandomPassword } = require('../utils/auth');
const { sendWelcomeEmail } = require('../services/emailService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadPath = './uploads/';
    
    if (file.fieldname === 'image' || file.fieldname === 'images') {
      uploadPath += 'images/';
    } else if (file.fieldname === 'pdf' || file.fieldname === 'pdfFile') {
      uploadPath += 'pdfs/';
    } else if (file.fieldname === 'dwg' || file.fieldname === 'dwgFile') {
      uploadPath += 'dwgs/';
    } else if (file.fieldname === 'textures') {
      uploadPath += 'textures/';
    }

    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image' || file.fieldname === 'images' || file.fieldname === 'textures') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    } else if (file.fieldname === 'pdf' || file.fieldname === 'pdfFile') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    } else if (file.fieldname === 'dwg' || file.fieldname === 'dwgFile') {
      cb(null, true);
    } else {
      cb(null, true);
    }
  }
});

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, company, email, role, profile_photo, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, company, email, role = 'user' } = req.body;

    if (!name || !company || !email) {
      return res.status(400).json({ error: 'Name, company, and email are required' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(tempPassword);

    const result = await pool.query(
      'INSERT INTO users (name, company, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, company, email, role, created_at',
      [name, company, email.toLowerCase(), hashedPassword, role]
    );

    await sendWelcomeEmail(email, name, tempPassword);

    res.status(201).json({
      user: result.rows[0],
      message: 'User created and credentials sent via email',
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, role } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (company) {
      updates.push(`company = $${paramCount++}`);
      values.push(company);
    }
    if (role) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, company, email, role`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, sku, dimensions, colors, finishes, variations } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // Handle multiple images
    let imageUrl = null;
    let allImages = null;
    if (req.files?.images && req.files.images.length > 0) {
      // Store first image as primary image
      imageUrl = `images/${req.files.images[0].filename}`;
      // Store all images
      allImages = req.files.images.map(file => `images/${file.filename}`);
    }

    // Handle PDF and DWG files
    const pdfUrl = req.files?.pdfFile ? `pdfs/${req.files.pdfFile[0].filename}` : null;
    const dwgUrl = req.files?.dwgFile ? `dwgs/${req.files.dwgFile[0].filename}` : null;
    
    // Handle texture files
    const textureUrls = req.files?.textures ? 
      req.files.textures.map(file => `textures/${file.filename}`) : null;

    // Parse dimensions if sent as JSON string
    const parsedDimensions = dimensions ? (typeof dimensions === 'string' ? dimensions : JSON.stringify(dimensions)) : null;
    
    // Parse variations if sent as JSON string
    const parsedVariations = variations ? (typeof variations === 'string' ? JSON.parse(variations) : variations) : null;
    
    // Parse colors if sent as JSON string
    const parsedColors = colors ? (typeof colors === 'string' ? JSON.parse(colors) : colors) : null;
    
    // Parse finishes if sent as JSON string
    const parsedFinishes = finishes ? (typeof finishes === 'string' ? JSON.parse(finishes) : finishes) : null;

    // For now, use the old dimensions format for backward compatibility
    let dimensionString = parsedDimensions;
    if (parsedDimensions) {
      try {
        const dimsArray = JSON.parse(parsedDimensions);
        if (Array.isArray(dimsArray) && dimsArray.length > 0) {
          // Convert to "Top Dia Xcm x Height Ycm x Bottom Dia Zcm" format
          const dimParts = [];
          dimsArray.forEach(dim => {
            dimParts.push(`${dim.type} ${dim.value}cm`);
          });
          dimensionString = dimParts.join(' x ');
        }
      } catch (e) {
        // If parsing fails, use as is
      }
    }

    const result = await pool.query(
      'INSERT INTO products (name, sku, description, dimensions, image_url, all_images, pdf_url, dwg_url, colors, finishes, textures, variations) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [name, sku || null, description || null, dimensionString || description, imageUrl, JSON.stringify(allImages), pdfUrl, dwgUrl, JSON.stringify(parsedColors), JSON.stringify(parsedFinishes), JSON.stringify(textureUrls), JSON.stringify(parsedVariations)]
    );

    console.log('Product created successfully:', result.rows[0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sku, dimensions, colors, finishes, variations } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name && name.trim()) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    
    // Handle SKU update
    if (sku !== undefined && sku !== null) {
      updates.push(`sku = $${paramCount++}`);
      values.push(sku);
    }
    
    // Handle description update
    if (description !== undefined && description !== null) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    
    // Handle dimensions - only update if provided and not empty
    if (dimensions) {
      const parsedDimensions = typeof dimensions === 'string' ? dimensions : JSON.stringify(dimensions);
      
      try {
        const dimsArray = JSON.parse(parsedDimensions);
        if (Array.isArray(dimsArray) && dimsArray.length > 0) {
          const dimParts = [];
          dimsArray.forEach(dim => {
            dimParts.push(`${dim.type} ${dim.value}cm`);
          });
          const dimensionString = dimParts.join(' x ');
          updates.push(`dimensions = $${paramCount++}`);
          values.push(dimensionString);
        }
      } catch (e) {
        // If parsing fails or not array, use description if available
        if (description && description.trim()) {
          updates.push(`dimensions = $${paramCount++}`);
          values.push(description);
        }
      }
    }
    
    // Handle colors update
    if (colors) {
      const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      if (Array.isArray(parsedColors) && parsedColors.length > 0) {
        updates.push(`colors = $${paramCount++}`);
        values.push(JSON.stringify(parsedColors));
      }
    }
    
    // Handle finishes update
    if (finishes) {
      const parsedFinishes = typeof finishes === 'string' ? JSON.parse(finishes) : finishes;
      if (Array.isArray(parsedFinishes) && parsedFinishes.length > 0) {
        updates.push(`finishes = $${paramCount++}`);
        values.push(JSON.stringify(parsedFinishes));
      }
    }
    
    // Handle variations update
    if (variations) {
      const parsedVariations = typeof variations === 'string' ? JSON.parse(variations) : variations;
      if (Array.isArray(parsedVariations) && parsedVariations.length > 0) {
        updates.push(`variations = $${paramCount++}`);
        values.push(JSON.stringify(parsedVariations));
      }
    }

    // Handle multiple images - only update if new images uploaded
    if (req.files?.images && req.files.images.length > 0) {
      const allImages = req.files.images.map(file => `images/${file.filename}`);
      updates.push(`image_url = $${paramCount++}`);
      values.push(allImages[0]); // Primary image
      updates.push(`all_images = $${paramCount++}`);
      values.push(JSON.stringify(allImages)); // All images
    }
    
    // Handle PDF file - only update if new file uploaded
    if (req.files?.pdfFile && req.files.pdfFile.length > 0) {
      updates.push(`pdf_url = $${paramCount++}`);
      values.push(`pdfs/${req.files.pdfFile[0].filename}`);
    }
    
    // Handle DWG file - only update if new file uploaded
    if (req.files?.dwgFile && req.files.dwgFile.length > 0) {
      updates.push(`dwg_url = $${paramCount++}`);
      values.push(`dwgs/${req.files.dwgFile[0].filename}`);
    }
    
    // Handle texture files - only update if new files uploaded
    if (req.files?.textures && req.files.textures.length > 0) {
      const textureUrls = req.files.textures.map(file => `textures/${file.filename}`);
      updates.push(`textures = $${paramCount++}`);
      values.push(JSON.stringify(textureUrls));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Product updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

const getAllRFPs = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT r.id, r.status, r.message, r.created_at,
             u.name as user_name, u.company as user_company, u.email as user_email,
             json_agg(json_build_object('id', p.id, 'name', p.name, 'image_url', p.image_url)) as products
      FROM rfps r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN rfp_items ri ON r.id = ri.rfp_id
      LEFT JOIN products p ON ri.product_id = p.id
    `;

    const params = [];
    if (status) {
      query += ' WHERE r.status = $1';
      params.push(status);
    }

    query += ' GROUP BY r.id, u.name, u.company, u.email ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get all RFPs error:', error);
    res.status(500).json({ error: 'Failed to fetch RFPs' });
  }
};

const updateRFPStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['New', 'Processing', 'Closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE rfps SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update RFP status error:', error);
    res.status(500).json({ error: 'Failed to update RFP status' });
  }
};

const getAccessLogs = async (req, res) => {
  try {
    const { user_id, product_id, file_type, limit = 100 } = req.query;

    let query = `
      SELECT fal.*, u.name as user_name, u.company as user_company, p.name as product_name
      FROM file_access_logs fal
      LEFT JOIN users u ON fal.user_id = u.id
      LEFT JOIN products p ON fal.product_id = p.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (user_id) {
      query += ` AND fal.user_id = $${paramCount++}`;
      params.push(user_id);
    }
    if (product_id) {
      query += ` AND fal.product_id = $${paramCount++}`;
      params.push(product_id);
    }
    if (file_type) {
      query += ` AND fal.file_type = $${paramCount++}`;
      params.push(file_type);
    }

    query += ` ORDER BY fal.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get access logs error:', error);
    res.status(500).json({ error: 'Failed to fetch access logs' });
  }
};

const getAccessRequests = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM access_requests ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get access requests error:', error);
    res.status(500).json({ error: 'Failed to fetch access requests' });
  }
};

module.exports = {
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
};
