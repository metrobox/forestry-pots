#!/bin/bash

echo "🌲 Forestry Pots - Quick Start Script"
echo "======================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

echo "📦 Installing backend dependencies..."
cd backend && npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create PostgreSQL database: createdb forestry_pots"
echo "2. Configure backend/.env (copy from backend/env.example)"
echo "3. Initialize database: cd backend && npm run init-db"
echo "4. Seed demo data: cd backend && node src/config/seedDatabase.js"
echo "5. Start backend: cd backend && npm run dev"
echo "6. Start frontend: cd frontend && npm run dev"
echo ""
echo "🔑 Default admin credentials:"
echo "   Email: admin@forestrypots.com"
echo "   Password: admin123"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:5000"
