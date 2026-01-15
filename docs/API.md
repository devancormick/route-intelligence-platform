# Route Intelligence Platform API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register Operator
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Operators

#### Get Operator Profile
```http
GET /api/operators/:id
# Use "me" to get current operator's profile
GET /api/operators/me
```

#### Update Operator Profile
```http
PUT /api/operators/:id
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "1234567890",
  "equipment": ["mower", "trimmer"],
  "capabilities": ["lawn_mowing", "landscaping"]
}
```

#### Set Service Area
```http
POST /api/operators/:id/service-area
Content-Type: application/json

{
  "coordinates": [
    [-98.5795, 39.8283],
    [-98.5795, 40.8283],
    [-97.5795, 40.8283],
    [-97.5795, 39.8283],
    [-98.5795, 39.8283]
  ]
}
```

### Routes

#### Create Route
```http
POST /api/routes
Content-Type: application/json

{
  "name": "Morning Route",
  "waypoints": [
    {
      "latitude": 39.8283,
      "longitude": -98.5795,
      "address": "123 Main St",
      "service_type": "lawn_mowing",
      "estimated_duration_minutes": 30
    }
  ],
  "start_time": "2024-01-15T08:00:00Z",
  "end_time": "2024-01-15T12:00:00Z"
}
```

#### Upload Route from File
```http
POST /api/routes/upload
Content-Type: multipart/form-data

file: <CSV|JSON|GPX|GeoJSON file>
```

#### Get Routes
```http
GET /api/routes
```

#### Get Route by ID
```http
GET /api/routes/:id
```

#### Update Route
```http
PUT /api/routes/:id
Content-Type: application/json

{
  "name": "Updated Route",
  "waypoints": [...]
}
```

#### Delete Route
```http
DELETE /api/routes/:id
```

### Jobs

#### Get Jobs
```http
GET /api/jobs?status=open&service_type=lawn_mowing&limit=50&offset=0
```

#### Create Job
```http
POST /api/jobs
Content-Type: application/json

{
  "title": "Lawn Mowing Service",
  "description": "Weekly lawn mowing",
  "latitude": 39.8283,
  "longitude": -98.5795,
  "address": "123 Main St, City, State",
  "service_type": "lawn_mowing",
  "requirements": ["mower"],
  "budget": 150.00
}
```

#### Get Job by ID
```http
GET /api/jobs/:id
```

#### Create Bid
```http
POST /api/jobs/:id/bids
Content-Type: application/json

{
  "amount": 120.00,
  "message": "I can complete this job efficiently"
}
```

### Optimization

#### Optimize Route
```http
POST /api/optimize/route
Content-Type: application/json

{
  "route_id": "uuid",
  "algorithm": "nearest_neighbor" | "genetic" | "simulated_annealing"
}
```

#### Analyze Gaps
```http
POST /api/optimize/gaps
Content-Type: application/json

{
  "route_id": "uuid"
}
```

#### Get Optimization Suggestions
```http
GET /api/optimize/suggestions
```

### Pricing

#### Get Pricing Recommendations
```http
GET /api/pricing/recommendations?job_type=lawn_mowing&latitude=39.8283&longitude=-98.5795
```

#### Analyze Pricing
```http
POST /api/pricing/analyze
Content-Type: application/json

{
  "job_type": "lawn_mowing",
  "latitude": 39.8283,
  "longitude": -98.5795,
  "service_area": "Kansas City"
}
```

#### Get Pricing History
```http
GET /api/pricing/history?job_type=lawn_mowing&limit=50&offset=0
```

### Maps

#### Get Directions
```http
POST /api/maps/directions
Content-Type: application/json

{
  "waypoints": [
    {"latitude": 39.8283, "longitude": -98.5795},
    {"latitude": 39.8383, "longitude": -98.5895}
  ],
  "profile": "driving" | "walking" | "cycling"
}
```

#### Geocode Address
```http
POST /api/maps/geocode
Content-Type: application/json

{
  "address": "123 Main St, Kansas City, MO"
}
```

#### Reverse Geocode
```http
POST /api/maps/reverse-geocode
Content-Type: application/json

{
  "latitude": 39.8283,
  "longitude": -98.5795
}
```

### OCR

#### Extract Text
```http
POST /api/ocr/extract-text
Content-Type: multipart/form-data

image: <image file>
language: eng (optional)
```

#### Extract Addresses
```http
POST /api/ocr/extract-addresses
Content-Type: multipart/form-data

image: <image file>
```

### Analytics

#### Get Operator Analytics
```http
GET /api/analytics/operator?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Route Performance
```http
GET /api/analytics/routes/performance
```

#### Get Pricing Trends
```http
GET /api/analytics/pricing/trends?job_type=lawn_mowing
```

## WebSocket Events

Connect to WebSocket server for real-time updates:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for route updates
socket.on('route:updated', (data) => {
  console.log('Route updated:', data);
});

// Subscribe to job updates
socket.emit('job:subscribe', 'job-id');
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "message": "Error description",
    "stack": "Stack trace (development only)"
  }
}
```

Common HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
