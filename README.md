# Route Intelligence Platform

A comprehensive, production-ready route-intelligence and marketplace platform for landscape operators. The platform optimizes routes, fills gaps, provides pricing guidance, and connects operators with jobs.

## 🚀 Features

### Core Features
- **Operator Onboarding**: Complete registration, profile management, and service area definition
- **Route Management**: Create, import, update, and optimize routes with geospatial data
- **Route Optimization**: Multiple algorithms (nearest neighbor, genetic, simulated annealing, OR-Tools)
- **Gap Analysis**: Identify route inefficiencies and suggest improvements
- **Pricing Guidance**: Market-based pricing recommendations with historical data analysis
- **Job Marketplace**: Post jobs, submit bids, and manage contracts
- **Real-time Updates**: WebSocket support for live route and job updates
- **File Import**: Support for CSV, JSON, GPX, and GeoJSON route files
- **OCR Processing**: Extract text, addresses, phone numbers, and prices from images
- **Map Integration**: Full Mapbox integration with route visualization
- **Analytics Dashboard**: Comprehensive analytics and performance metrics

### Advanced Features
- **Multi-objective Optimization**: Consider distance, time, and priority
- **Time Windows**: Support for time-constrained route optimization
- **Service Area Management**: Define and manage service areas with PostGIS
- **Bid Management**: Complete bidding system with status tracking
- **Pricing History**: Track and analyze pricing trends
- **Route Sharing**: Share routes between operators
- **Performance Metrics**: Track route performance over time

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Mapbox GL
- **Backend**: Node.js, Express, TypeScript, PostgreSQL with PostGIS
- **Optimization Engine**: Python, FastAPI, OR-Tools, NumPy, SciPy
- **Mobile**: Android (Kotlin) with Mapbox SDK
- **Real-time**: Socket.io for WebSocket support
- **Maps**: Mapbox API for geocoding, directions, and visualization
- **OCR**: Tesseract.js for document processing
- **Containerization**: Docker and Docker Compose

### System Components

```
route-intelligence-platform/
├── backend/          # Node.js/TypeScript API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic services
│   │   ├── middleware/ # Auth, validation, rate limiting
│   │   └── utils/    # Utility functions
│   └── __tests__/   # Test suite
├── frontend/         # React/TypeScript frontend
│   ├── src/
│   │   ├── pages/   # Page components
│   │   ├── components/ # Reusable components
│   │   └── hooks/   # Custom React hooks
├── optimization/     # Python optimization engine
│   └── main.py      # FastAPI service
├── mobile/          # Android mobile app
├── database/        # Database schemas and migrations
└── docs/           # Documentation
```

## 📋 Prerequisites

- Node.js 18+
- Python 3.9+
- Docker and Docker Compose
- PostgreSQL 14+ with PostGIS extension
- Mapbox account (for map features)
- Google Maps API key (optional)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/route-intelligence-platform.git
cd route-intelligence-platform
```

### 2. Environment Setup

Create `.env` files:

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://route_user:route_password@localhost:5432/route_intelligence
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
PORT=3001
OPTIMIZATION_SERVICE_URL=http://localhost:8000
MAPBOX_ACCESS_TOKEN=your_mapbox_token
GOOGLE_MAPS_API_KEY=your_google_maps_key
LOG_LEVEL=info
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### 3. Install Dependencies

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..

# Python optimization service
cd optimization && pip install -r requirements.txt && cd ..
```

### 4. Start Services

```bash
# Start database and optimization service
docker-compose up -d postgres optimization

# Wait for database to be ready
sleep 10

# Run database migrations
docker exec -i route-intelligence-db psql -U route_user -d route_intelligence < database/schema.sql

# Start backend (in one terminal)
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm run dev
```

Or use the convenience script:
```bash
npm run dev
```

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 📚 API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

## 🗺️ Database Schema

The platform uses PostgreSQL with PostGIS extension for geospatial data:

- **operators**: Operator profiles and service areas
- **routes**: Route definitions with geospatial waypoints
- **route_waypoints**: Detailed waypoint information
- **jobs**: Job postings and marketplace
- **bids**: Bidding system
- **pricing_history**: Historical pricing data
- **route_optimizations**: Optimization results
- **gap_analyses**: Gap analysis results

## 🚀 Deployment

### Production Deployment

1. **Build the applications**:
```bash
npm run build
```

2. **Set up production environment variables**

3. **Use Docker Compose for production**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. **Set up reverse proxy** (nginx recommended)

5. **Configure SSL certificates**

6. **Set up monitoring and logging**

## 📱 Mobile App

The Android mobile app provides:
- Route navigation
- Job management
- Real-time updates
- Offline capabilities

See `mobile/README.md` for mobile app setup instructions.

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- SQL injection prevention
- CORS configuration
- Helmet.js security headers

## 📊 Analytics

The platform provides comprehensive analytics:
- Route performance metrics
- Optimization savings
- Job and bid statistics
- Pricing trends
- Revenue tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Built for landscape operators to optimize their routes and grow their business.

## 🆘 Support

For issues and questions:
- Check the [API Documentation](docs/API.md)
- Review existing issues
- Create a new issue with detailed information

## 🗺️ Roadmap

- [ ] Machine learning for pricing predictions
- [ ] Advanced traffic integration
- [ ] Multi-operator collaboration features
- [ ] Mobile app for iOS
- [ ] Advanced reporting and exports
- [ ] Integration with popular scheduling tools
- [ ] Automated route suggestions based on history
