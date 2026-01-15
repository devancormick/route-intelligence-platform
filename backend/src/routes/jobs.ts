import express from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = express.Router();

router.use(authenticate);

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().min(1),
  service_type: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  budget: z.number().optional(),
});

const createBidSchema = z.object({
  amount: z.number().positive(),
  message: z.string().optional(),
});

// Get jobs
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, service_type, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT j.id, j.title, j.description, j.address, j.service_type,
             j.requirements, j.budget, j.status, j.created_at,
             ST_AsGeoJSON(j.location) as location,
             j.created_by, j.assigned_to
      FROM jobs j
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND j.status = $${paramCount++}`;
      params.push(status);
    }

    if (service_type) {
      queryText += ` AND j.service_type = $${paramCount++}`;
      params.push(service_type);
    }

    queryText += ` ORDER BY j.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Create job
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { title, description, latitude, longitude, address, service_type, requirements, budget } =
      createJobSchema.parse(req.body);

    const pointWKT = `POINT(${longitude} ${latitude})`;

    const result = await query(
      `INSERT INTO jobs (title, description, location, address, service_type, requirements, budget, created_by)
       VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5, $6, $7, $8)
       RETURNING id, title, description, address, service_type, requirements, budget, status, created_at`,
      [
        title,
        description || null,
        pointWKT,
        address,
        service_type || null,
        requirements || null,
        budget || null,
        req.operatorId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get job by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT j.id, j.title, j.description, j.address, j.service_type,
              j.requirements, j.budget, j.status, j.created_at,
              ST_AsGeoJSON(j.location) as location,
              j.created_by, j.assigned_to
       FROM jobs j
       WHERE j.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Job not found', 404);
    }

    // Get bids for this job
    const bidsResult = await query(
      `SELECT b.id, b.operator_id, b.amount, b.status, b.message, b.submitted_at,
              o.name as operator_name
       FROM bids b
       JOIN operators o ON b.operator_id = o.id
       WHERE b.job_id = $1
       ORDER BY b.submitted_at DESC`,
      [req.params.id]
    );

    res.json({
      ...result.rows[0],
      bids: bidsResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Create bid on job
router.post('/:id/bids', async (req: AuthRequest, res, next) => {
  try {
    const { amount, message } = createBidSchema.parse(req.body);

    // Check if job exists
    const jobResult = await query('SELECT id, status FROM jobs WHERE id = $1', [
      req.params.id,
    ]);

    if (jobResult.rows.length === 0) {
      throw new AppError('Job not found', 404);
    }

    if (jobResult.rows[0].status !== 'open') {
      throw new AppError('Job is not open for bidding', 400);
    }

    // Check if operator already bid
    const existingBid = await query(
      'SELECT id FROM bids WHERE job_id = $1 AND operator_id = $2',
      [req.params.id, req.operatorId]
    );

    if (existingBid.rows.length > 0) {
      throw new AppError('You have already submitted a bid for this job', 409);
    }

    const result = await query(
      `INSERT INTO bids (job_id, operator_id, amount, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, job_id, operator_id, amount, status, message, submitted_at`,
      [req.params.id, req.operatorId, amount, message || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
