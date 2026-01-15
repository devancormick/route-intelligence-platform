#!/usr/bin/env node

/**
 * Script to create a test user with known credentials
 * Usage: node scripts/create_test_user.js
 * 
 * Note: This script should be run from the backend directory where pg and bcryptjs are installed
 */

const path = require('path');

// Change to backend directory to access node_modules
process.chdir(path.join(__dirname, '..', 'backend'));

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://route_user:route_password@localhost:5432/route_intelligence',
});

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'password123';
    const name = 'Test Operator';

    // Check if user exists
    const existing = await pool.query('SELECT id FROM operators WHERE email = $1', [email]);
    
    if (existing.rows.length > 0) {
      console.log('✅ Test user already exists');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO operators (name, email, password_hash, equipment, capabilities)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email`,
      [
        name,
        email,
        passwordHash,
        ['mower', 'trimmer'],
        ['lawn_mowing', 'edging'],
      ]
    );

    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', result.rows[0].name);
    console.log('🆔 ID:', result.rows[0].id);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTestUser();
