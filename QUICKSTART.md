# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Setup Database and Seed Data

```bash
./scripts/setup_examples.sh
```

This will:
- Start the PostgreSQL database
- Create all tables
- Load example data (operators, routes, jobs, bids)
- Create a test user

### 2. Start Backend Server

```bash
cd backend
export DATABASE_URL=postgresql://route_user:route_password@localhost:5432/route_intelligence
export JWT_SECRET=dev-secret-key
export PORT=3001
export OPTIMIZATION_SERVICE_URL=http://localhost:8000
npm run dev
```

### 3. Start Frontend (in a new terminal)

```bash
cd frontend
export VITE_API_URL=http://localhost:3001
npm run dev
```

### 4. Start Optimization Service (optional, in another terminal)

```bash
docker-compose up optimization
```

### 5. Access the Application

Open your browser to: **http://localhost:3000**

## 🔑 Test Credentials

**Test User:**
- Email: `test@example.com`
- Password: `password123`

**Example Operators:**
- Email: `greenthumb@example.com`
- Password: `password123`

- Email: `perfect@example.com`
- Password: `password123`

- Email: `elite@example.com`
- Password: `password123`

## 📁 Example Files

Try uploading these example route files:

1. **CSV**: `examples/routes_example.csv`
2. **JSON**: `examples/routes_example.json`
3. **GPX**: `examples/routes_example.gpx`

## 🧪 Test the API

### Login and Get Token

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Routes

```bash
curl http://localhost:3001/api/routes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Jobs

```bash
curl http://localhost:3001/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 What's Included

The seed data includes:
- ✅ 4 operators (including test user)
- ✅ 3 routes with waypoints
- ✅ 4 jobs in the marketplace
- ✅ 5 bids on jobs
- ✅ 9 pricing history records
- ✅ 1 route optimization result
- ✅ 2 gap analyses

## 🐛 Troubleshooting

### Database not running?
```bash
docker-compose up -d postgres
```

### Port already in use?
Change the PORT in backend/.env or frontend/.env

### Can't connect to database?
Make sure the database container is running:
```bash
docker ps | grep route-intelligence-db
```

### Need to reset everything?
```bash
docker-compose down -v
./scripts/setup_examples.sh
```

## 🎯 Next Steps

1. **Explore the Dashboard** - See your routes, jobs, and analytics
2. **Create a Route** - Add waypoints manually or upload a file
3. **Optimize a Route** - Use the optimization endpoint
4. **Browse Jobs** - Check out the marketplace
5. **Submit a Bid** - Try bidding on a job
6. **View Analytics** - Check your performance metrics

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Features List](FEATURES.md)
- [Full README](README.md)
