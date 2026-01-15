#!/bin/bash

# Complete setup script with examples
# Usage: ./scripts/setup_examples.sh

set -e

echo "🚀 Setting up Route Intelligence Platform with examples..."

# 1. Start database
echo "📦 Starting database..."
docker-compose up -d postgres

# 2. Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 10

# 3. Create schema
echo "📝 Creating database schema..."
docker exec -i route-intelligence-db psql -U route_user -d route_intelligence < database/schema.sql

# 4. Seed database
echo "🌱 Seeding database with example data..."
docker exec -i route-intelligence-db psql -U route_user -d route_intelligence < database/seed.sql

# 5. Create test user
echo "👤 Creating test user..."
docker exec -i route-intelligence-db psql -U route_user -d route_intelligence < database/seed_test_user.sql

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Example data loaded:"
echo "   - 3 operators (plus 1 test user)"
echo "   - 3 routes with waypoints"
echo "   - 4 jobs"
echo "   - 5 bids"
echo "   - 9 pricing history records"
echo ""
echo "🔑 Test credentials:"
echo "   Email: test@example.com"
echo "   Password: password123"
echo ""
echo "   Email: greenthumb@example.com"
echo "   Password: password123"
echo ""
echo "📁 Example route files available in:"
echo "   - examples/routes_example.csv"
echo "   - examples/routes_example.json"
echo "   - examples/routes_example.gpx"
echo ""
echo "🚀 Next steps:"
echo "   1. Start backend: cd backend && npm run dev"
echo "   2. Start frontend: cd frontend && npm run dev"
echo "   3. Visit http://localhost:3000"
echo "   4. Login with test@example.com / password123"
