import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register new operator
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = registerSchema.parse(req.body);

    // Check if operator exists
    const existingOperator = await query(
      'SELECT id FROM operators WHERE email = $1',
      [email]
    );

    if (existingOperator.rows.length > 0) {
      throw new AppError('Operator with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create operator
    const result = await query(
      `INSERT INTO operators (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, created_at`,
      [name, email, phone || null, passwordHash]
    );

    const operator = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: operator.id, operatorId: operator.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      operator: {
        id: operator.id,
        name: operator.name,
        email: operator.email,
        phone: operator.phone,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find operator
    const result = await query(
      'SELECT id, name, email, phone, password_hash FROM operators WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const operator = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, operator.password_hash);

    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: operator.id, operatorId: operator.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      operator: {
        id: operator.id,
        name: operator.name,
        email: operator.email,
        phone: operator.phone,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
