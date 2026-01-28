const pool = require('../config/database');

const getProducts = async (req, res) => {
  try {
    const { 
      search, 
      page = 1, 
      limit = 12,
      topDiaMin,
      topDiaMax,
      heightMin,
      heightMax,
      bottomDiaMin,
      bottomDiaMax
    } = req.query;
    
    console.log('Get products request:', { search, page, limit, filters: { topDiaMin, topDiaMax, heightMin, heightMax, bottomDiaMin, bottomDiaMax } });
    
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products';
    let countQuery = 'SELECT COUNT(*) FROM products';
    const queryParams = [];
    const countParams = [];
    let paramIndex = 1;
    const whereClauses = [];

    // Search filter (name, SKU, dimensions)
    if (search) {
      whereClauses.push(`(name ILIKE $${paramIndex} OR dimensions ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
      paramIndex++;
    }

    // Dimension filters - parse format: "Top Dia Xcm x Height Ycm x Bottom Dia Zcm"
    // Only filter products that have the parseable format; include all products that don't match the format
    if (topDiaMin || topDiaMax || heightMin || heightMax || bottomDiaMin || bottomDiaMax) {
      // Use regex to extract numeric values from dimension string
      const dimensionConditions = [];
      
      if (topDiaMin) {
        dimensionConditions.push(`CAST(SUBSTRING(dimensions FROM 'Top Dia ([0-9]+)cm') AS INTEGER) >= ${parseInt(topDiaMin)}`);
      }
      if (topDiaMax) {
        dimensionConditions.push(`CAST(SUBSTRING(dimensions FROM 'Top Dia ([0-9]+)cm') AS INTEGER) <= ${parseInt(topDiaMax)}`);
      }
      if (heightMin) {
        dimensionConditions.push(`CAST(SUBSTRING(dimensions FROM 'Height ([0-9]+)cm') AS INTEGER) >= ${parseInt(heightMin)}`);
      }
      if (heightMax) {
        dimensionConditions.push(`CAST(SUBSTRING(dimensions FROM 'Height ([0-9]+)cm') AS INTEGER) <= ${parseInt(heightMax)}`);
      }
      if (bottomDiaMin) {
        dimensionConditions.push(`CAST(SUBSTRING(dimensions FROM 'Bottom Dia ([0-9]+)cm') AS INTEGER) >= ${parseInt(bottomDiaMin)}`);
      }
      if (bottomDiaMax) {
        dimensionConditions.push(`CAST(SUBSTRING(dimensions FROM 'Bottom Dia ([0-9]+)cm') AS INTEGER) <= ${parseInt(bottomDiaMax)}`);
      }
      
      if (dimensionConditions.length > 0) {
        // Include products that either match the dimension filters OR don't have the parseable format
        whereClauses.push(`((${dimensionConditions.join(' AND ')}) OR dimensions !~ 'Top Dia [0-9]+cm x Height [0-9]+cm x Bottom Dia [0-9]+cm')`);
      }
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
      countQuery += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';
    queryParams.push(limit, offset);
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const [productsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams),
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    console.log('Products query results:', { 
      totalCount, 
      totalPages, 
      returnedProducts: productsResult.rows.length,
      productIds: productsResult.rows.map(p => p.id)
    });

    res.json({
      products: productsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

module.exports = {
  getProducts,
  getProduct,
};
