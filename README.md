# Route-Intelligence Platform for Landscape Operators

A route-intelligence and marketplace platform that optimizes routes, fills gaps, and provides pricing guidance for independent landscape operators.

## Features

- **Operator Onboarding**: Registration, profile management, and service area definition
- **Route Ingestion**: Import and manage routes with geospatial data
- **Route Optimization**: Multi-stop route optimization with traffic awareness
- **Gap Filling**: Identify and fill route inefficiencies
- **Pricing Guidance**: Market-based pricing recommendations
- **Job Marketplace**: Connect operators with jobs

## Tech Stack

- **Frontend**: React/TypeScript
- **Backend**: Node.js/TypeScript, Python
- **Database**: PostgreSQL with PostGIS
- **Maps**: Mapbox/Google Maps
- **Mobile**: Android
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Docker and Docker Compose
- PostgreSQL 14+ with PostGIS extension

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```
3. Set up environment variables (see `.env.example`)
4. Start services with Docker:
   ```bash
   docker-compose up -d
   ```
5. Run database migrations
6. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
route-intelligence-platform/
├── backend/          # Node.js/TypeScript API server
├── frontend/         # React/TypeScript frontend
├── optimization/     # Python optimization engine
├── mobile/           # Android mobile app
├── database/         # Database migrations and schemas
└── docker/           # Docker configurations
```

## License

Proprietary
