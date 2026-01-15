-- Create test user with known credentials
-- Password: password123 (hashed with bcrypt)

INSERT INTO operators (id, name, email, phone, password_hash, equipment, capabilities, pricing_preferences)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Operator',
  'test@example.com',
  '555-0000',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',
  ARRAY['mower', 'trimmer'],
  ARRAY['lawn_mowing', 'edging'],
  '{"lawn_mowing": 50, "edging": 25}'::jsonb
)
ON CONFLICT (email) DO NOTHING;
