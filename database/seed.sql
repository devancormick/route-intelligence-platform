-- Seed data for Route Intelligence Platform
-- This script populates the database with example data for testing

-- Insert sample operators
INSERT INTO operators (id, name, email, phone, password_hash, equipment, capabilities, pricing_preferences) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Green Thumb Landscaping', 'greenthumb@example.com', '555-0101', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 
 ARRAY['mower', 'trimmer', 'edger', 'blower'], 
 ARRAY['lawn_mowing', 'edging', 'trimming', 'blowing'],
 '{"lawn_mowing": 50, "edging": 25, "trimming": 30}'::jsonb),

('550e8400-e29b-41d4-a716-446655440002', 'Perfect Lawns Inc', 'perfect@example.com', '555-0102', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',
 ARRAY['mower', 'trimmer', 'fertilizer_spreader'], 
 ARRAY['lawn_mowing', 'fertilization', 'weed_control'],
 '{"lawn_mowing": 45, "fertilization": 80, "weed_control": 60}'::jsonb),

('550e8400-e29b-41d4-a716-446655440003', 'Elite Landscaping Services', 'elite@example.com', '555-0103', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',
 ARRAY['mower', 'trimmer', 'hedge_trimmer', 'pruner'], 
 ARRAY['lawn_mowing', 'hedge_trimming', 'tree_trimming', 'landscaping'],
 '{"lawn_mowing": 55, "hedge_trimming": 40, "tree_trimming": 100, "landscaping": 200}'::jsonb);

-- Set service areas for operators (Kansas City area)
UPDATE operators SET service_area = ST_GeomFromText(
  'POLYGON((-94.6 39.0, -94.4 39.0, -94.4 39.2, -94.6 39.2, -94.6 39.0))', 4326
) WHERE id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE operators SET service_area = ST_GeomFromText(
  'POLYGON((-94.5 39.1, -94.3 39.1, -94.3 39.3, -94.5 39.3, -94.5 39.1))', 4326
) WHERE id = '550e8400-e29b-41d4-a716-446655440002';

UPDATE operators SET service_area = ST_GeomFromText(
  'POLYGON((-94.7 38.9, -94.5 38.9, -94.5 39.1, -94.7 39.1, -94.7 38.9))', 4326
) WHERE id = '550e8400-e29b-41d4-a716-446655440003';

-- Insert sample routes
INSERT INTO routes (id, operator_id, name, waypoints, distance_km, duration_minutes, optimized, start_time, end_time) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Monday Morning Route',
 ST_GeomFromText('LINESTRING(-94.5795 39.0997, -94.5695 39.1097, -94.5595 39.1197, -94.5495 39.1297)', 4326),
 12.5, 180, false,
 '2024-01-15 08:00:00', '2024-01-15 11:00:00'),

('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Tuesday Route',
 ST_GeomFromText('LINESTRING(-94.5795 39.0997, -94.5895 39.0897, -94.5995 39.0797)', 4326),
 8.3, 120, true,
 '2024-01-16 08:00:00', '2024-01-16 10:00:00'),

('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Weekly Route 1',
 ST_GeomFromText('LINESTRING(-94.4795 39.1997, -94.4695 39.2097, -94.4595 39.2197, -94.4495 39.2297)', 4326),
 15.2, 240, false,
 '2024-01-15 09:00:00', '2024-01-15 13:00:00');

-- Insert route waypoints
INSERT INTO route_waypoints (route_id, sequence_order, location, address, service_type, estimated_duration_minutes) VALUES
('660e8400-e29b-41d4-a716-446655440001', 1, ST_GeomFromText('POINT(-94.5795 39.0997)', 4326), '123 Main St, Kansas City, MO', 'lawn_mowing', 30),
('660e8400-e29b-41d4-a716-446655440001', 2, ST_GeomFromText('POINT(-94.5695 39.1097)', 4326), '456 Oak Ave, Kansas City, MO', 'lawn_mowing', 45),
('660e8400-e29b-41d4-a716-446655440001', 3, ST_GeomFromText('POINT(-94.5595 39.1197)', 4326), '789 Pine Rd, Kansas City, MO', 'edging', 20),
('660e8400-e29b-41d4-a716-446655440001', 4, ST_GeomFromText('POINT(-94.5495 39.1297)', 4326), '321 Elm St, Kansas City, MO', 'lawn_mowing', 35),

('660e8400-e29b-41d4-a716-446655440002', 1, ST_GeomFromText('POINT(-94.5795 39.0997)', 4326), '123 Main St, Kansas City, MO', 'lawn_mowing', 30),
('660e8400-e29b-41d4-a716-446655440002', 2, ST_GeomFromText('POINT(-94.5895 39.0897)', 4326), '654 Maple Dr, Kansas City, MO', 'trimming', 25),
('660e8400-e29b-41d4-a716-446655440002', 3, ST_GeomFromText('POINT(-94.5995 39.0797)', 4326), '987 Cedar Ln, Kansas City, MO', 'lawn_mowing', 40);

-- Insert sample jobs
INSERT INTO jobs (id, title, description, location, address, service_type, requirements, budget, status, created_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Weekly Lawn Mowing Service', 
 'Need weekly lawn mowing for residential property. Front and back yard.', 
 ST_GeomFromText('POINT(-94.5795 39.0997)', 4326),
 '123 Main St, Kansas City, MO 64108',
 'lawn_mowing', ARRAY['mower'], 150.00, 'open', '550e8400-e29b-41d4-a716-446655440001'),

('770e8400-e29b-41d4-a716-446655440002', 'Hedge Trimming Needed',
 'Large hedge needs trimming and shaping. Approximately 50 feet long.',
 ST_GeomFromText('POINT(-94.5695 39.1097)', 4326),
 '456 Oak Ave, Kansas City, MO 64109',
 'hedge_trimming', ARRAY['hedge_trimmer'], 120.00, 'open', '550e8400-e29b-41d4-a716-446655440001'),

('770e8400-e29b-41d4-a716-446655440003', 'Complete Landscaping Project',
 'New landscaping project including lawn installation, tree planting, and irrigation setup.',
 ST_GeomFromText('POINT(-94.5595 39.1197)', 4326),
 '789 Pine Rd, Kansas City, MO 64110',
 'landscaping', ARRAY['mower', 'trimmer', 'shovel', 'irrigation_tools'], 2500.00, 'open', '550e8400-e29b-41d4-a716-446655440002'),

('770e8400-e29b-41d4-a716-446655440004', 'Lawn Fertilization Service',
 'Need fertilization for 5000 sq ft lawn. Spring treatment.',
 ST_GeomFromText('POINT(-94.5495 39.1297)', 4326),
 '321 Elm St, Kansas City, MO 64111',
 'fertilization', ARRAY['fertilizer_spreader'], 180.00, 'assigned', '550e8400-e29b-41d4-a716-446655440002');

UPDATE jobs SET assigned_to = '550e8400-e29b-41d4-a716-446655440003' WHERE id = '770e8400-e29b-41d4-a716-446655440004';

-- Insert sample bids
INSERT INTO bids (id, job_id, operator_id, amount, status, message) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 140.00, 'pending', 'I can start this week and provide weekly service.'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 145.00, 'pending', 'Experienced with residential properties.'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 110.00, 'accepted', 'I specialize in hedge trimming and can complete this efficiently.'),

('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 2400.00, 'pending', 'We have extensive experience with large landscaping projects.'),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 2550.00, 'pending', 'Can provide detailed project plan and timeline.');

-- Insert pricing history
INSERT INTO pricing_history (operator_id, job_type, location, price, service_area, timestamp) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'lawn_mowing', ST_GeomFromText('POINT(-94.5795 39.0997)', 4326), 50.00, 'Kansas City', '2024-01-01 10:00:00'),
('550e8400-e29b-41d4-a716-446655440001', 'lawn_mowing', ST_GeomFromText('POINT(-94.5695 39.1097)', 4326), 55.00, 'Kansas City', '2024-01-05 10:00:00'),
('550e8400-e29b-41d4-a716-446655440001', 'edging', ST_GeomFromText('POINT(-94.5595 39.1197)', 4326), 25.00, 'Kansas City', '2024-01-08 10:00:00'),

('550e8400-e29b-41d4-a716-446655440002', 'lawn_mowing', ST_GeomFromText('POINT(-94.4795 39.1997)', 4326), 45.00, 'Kansas City', '2024-01-02 10:00:00'),
('550e8400-e29b-41d4-a716-446655440002', 'fertilization', ST_GeomFromText('POINT(-94.4695 39.2097)', 4326), 80.00, 'Kansas City', '2024-01-06 10:00:00'),
('550e8400-e29b-41d4-a716-446655440002', 'weed_control', ST_GeomFromText('POINT(-94.4595 39.2197)', 4326), 60.00, 'Kansas City', '2024-01-10 10:00:00'),

('550e8400-e29b-41d4-a716-446655440003', 'lawn_mowing', ST_GeomFromText('POINT(-94.5795 39.0997)', 4326), 55.00, 'Kansas City', '2024-01-03 10:00:00'),
('550e8400-e29b-41d4-a716-446655440003', 'hedge_trimming', ST_GeomFromText('POINT(-94.5695 39.1097)', 4326), 40.00, 'Kansas City', '2024-01-07 10:00:00'),
('550e8400-e29b-41d4-a716-446655440003', 'tree_trimming', ST_GeomFromText('POINT(-94.5595 39.1197)', 4326), 100.00, 'Kansas City', '2024-01-11 10:00:00');

-- Insert route optimizations
INSERT INTO route_optimizations (route_id, original_distance_km, optimized_distance_km, original_duration_minutes, optimized_duration_minutes, savings_percentage, optimization_algorithm, optimized_waypoints) VALUES
('660e8400-e29b-41d4-a716-446655440002', 10.5, 8.3, 150, 120, 21.0, 'nearest_neighbor',
 ST_GeomFromText('LINESTRING(-94.5795 39.0997, -94.5995 39.0797, -94.5895 39.0897)', 4326));

-- Insert gap analyses
INSERT INTO gap_analyses (operator_id, route_id, gap_type, location, description, suggested_improvement, potential_savings) VALUES
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'large_distance',
 ST_GeomFromText('POINT(-94.5695 39.1097)', 4326),
 'Large distance between stops 2 and 3',
 'Consider reordering stops to minimize travel distance',
 15.5),

('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'time_gap',
 ST_GeomFromText('POINT(-94.5595 39.1197)', 4326),
 'Time gap detected in route schedule',
 'Fill gap with nearby jobs from marketplace',
 8.2);
