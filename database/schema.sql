-- Route Intelligence Platform Database Schema
-- PostgreSQL with PostGIS extension

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Operators table
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    service_area GEOMETRY(POLYGON, 4326),
    equipment TEXT[],
    capabilities TEXT[],
    pricing_preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operators_email ON operators(email);
CREATE INDEX idx_operators_service_area ON operators USING GIST(service_area);

-- Routes table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    name VARCHAR(255),
    waypoints GEOMETRY(LINESTRING, 4326),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    distance_km DECIMAL(10, 2),
    duration_minutes INTEGER,
    optimized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_routes_operator ON routes(operator_id);
CREATE INDEX idx_routes_waypoints ON routes USING GIST(waypoints);

-- Route waypoints table (for detailed stop information)
CREATE TABLE route_waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    address TEXT,
    service_type VARCHAR(100),
    estimated_duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waypoints_route ON route_waypoints(route_id);
CREATE INDEX idx_waypoints_location ON route_waypoints USING GIST(location);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location GEOMETRY(POINT, 4326) NOT NULL,
    address TEXT NOT NULL,
    service_type VARCHAR(100),
    requirements TEXT[],
    budget DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'open',
    created_by UUID REFERENCES operators(id),
    assigned_to UUID REFERENCES operators(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_location ON jobs USING GIST(location);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);

-- Bids table
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    message TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, operator_id)
);

CREATE INDEX idx_bids_job ON bids(job_id);
CREATE INDEX idx_bids_operator ON bids(operator_id);
CREATE INDEX idx_bids_status ON bids(status);

-- Pricing history table
CREATE TABLE pricing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operators(id),
    job_type VARCHAR(100),
    location GEOMETRY(POINT, 4326),
    price DECIMAL(10, 2) NOT NULL,
    service_area VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_operator ON pricing_history(operator_id);
CREATE INDEX idx_pricing_location ON pricing_history USING GIST(location);
CREATE INDEX idx_pricing_timestamp ON pricing_history(timestamp);

-- Route optimization results
CREATE TABLE route_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    original_distance_km DECIMAL(10, 2),
    optimized_distance_km DECIMAL(10, 2),
    original_duration_minutes INTEGER,
    optimized_duration_minutes INTEGER,
    savings_percentage DECIMAL(5, 2),
    optimization_algorithm VARCHAR(100),
    optimized_waypoints GEOMETRY(LINESTRING, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_optimizations_route ON route_optimizations(route_id);

-- Gap analysis results
CREATE TABLE gap_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id),
    gap_type VARCHAR(100),
    location GEOMETRY(POINT, 4326),
    description TEXT,
    suggested_improvement TEXT,
    potential_savings DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gaps_operator ON gap_analyses(operator_id);
CREATE INDEX idx_gaps_location ON gap_analyses USING GIST(location);
