const pool = require('./src/config/database');

async function addVariationsColumn() {
  try {
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS variations JSONB');
    console.log('✓ Variations column added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding variations column:', error.message);
    process.exit(1);
  }
}

addVariationsColumn();
