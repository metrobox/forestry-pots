const pool = require('./database');
const { hashPassword } = require('../utils/auth');

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('Seeding admin user...');
    const adminPassword = await hashPassword('admin123');
    await client.query(`
      INSERT INTO users (name, company, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin User', 'Forestry Pots Inc.', 'admin@forestrypots.com', adminPassword, 'admin']);

    console.log('Seeding demo user...');
    const demoPassword = await hashPassword('demo123');
    await client.query(`
      INSERT INTO users (name, company, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Demo User', 'Demo Company', 'demo@example.com', demoPassword, 'user']);

    console.log('Seeding demo products...');
    const products = [
      { name: 'Forestry Pot 200L', dimensions: 'Top Dia 60cm x Height 50cm x Bottom Dia 55cm' },
      { name: 'Forestry Pot 150L', dimensions: 'Top Dia 50cm x Height 45cm x Bottom Dia 45cm' },
      { name: 'Forestry Pot 100L', dimensions: 'Top Dia 45cm x Height 40cm x Bottom Dia 40cm' },
      { name: 'Forestry Pot 75L', dimensions: 'Top Dia 40cm x Height 35cm x Bottom Dia 36cm' },
      { name: 'Forestry Pot 50L', dimensions: 'Top Dia 35cm x Height 30cm x Bottom Dia 32cm' },
      { name: 'Forestry Pot 25L', dimensions: 'Top Dia 30cm x Height 25cm x Bottom Dia 28cm' },
      { name: 'Square Container XL', dimensions: 'Top Dia 80cm x Height 60cm x Bottom Dia 76cm' },
      { name: 'Square Container L', dimensions: 'Top Dia 70cm x Height 55cm x Bottom Dia 66cm' },
      { name: 'Square Container M', dimensions: 'Top Dia 60cm x Height 50cm x Bottom Dia 56cm' },
      { name: 'Round Pot Premium 300L', dimensions: 'Top Dia 80cm x Height 70cm x Bottom Dia 74cm' },
      { name: 'Round Pot Premium 200L', dimensions: 'Top Dia 70cm x Height 60cm x Bottom Dia 65cm' },
      { name: 'Round Pot Standard 150L', dimensions: 'Top Dia 60cm x Height 55cm x Bottom Dia 56cm' },
      { name: 'Round Pot Standard 100L', dimensions: 'Top Dia 50cm x Height 45cm x Bottom Dia 46cm' },
      { name: 'Rectangular Planter 250L', dimensions: 'Top Dia 100cm x Height 50cm x Bottom Dia 95cm' },
      { name: 'Rectangular Planter 180L', dimensions: 'Top Dia 90cm x Height 45cm x Bottom Dia 85cm' },
      { name: 'Nursery Pot Commercial 500L', dimensions: 'Top Dia 120cm x Height 70cm x Bottom Dia 115cm' },
    ];

    for (const product of products) {
      await client.query(`
        INSERT INTO products (name, dimensions)
        VALUES ($1, $2)
      `, [product.name, product.dimensions]);
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDatabase()
  .then(() => {
    console.log('Seed complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
