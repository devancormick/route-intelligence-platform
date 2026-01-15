#!/bin/bash

# Script to seed the database with example data
# Usage: ./scripts/seed_database.sh

set -e

echo "🌱 Seeding database with example data..."

# Check if database is running
if ! docker ps | grep -q route-intelligence-db; then
    echo "❌ Database container is not running. Please start it first with: docker-compose up -d postgres"
    exit 1
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run seed script
echo "📝 Running seed script..."
docker exec -i route-intelligence-db psql -U route_user -d route_intelligence < database/seed.sql

echo "✅ Database seeded successfully!"
echo ""
echo "📊 Example data created:"
echo "   - 3 operators"
echo "   - 3 routes with waypoints"
echo "   - 4 jobs"
echo "   - 5 bids"
echo "   - 9 pricing history records"
echo "   - 1 route optimization"
echo "   - 2 gap analyses"
echo ""
echo "🔑 Test credentials:"
echo "   Email: greenthumb@example.com"
echo "   Password: password123"
echo ""
echo "   Email: perfect@example.com"
echo "   Password: password123"
echo ""
echo "   Email: elite@example.com"
echo "   Password: password123"
