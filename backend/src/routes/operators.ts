import express from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = express.Router();

router.use(authenticate);

const updateOperatorSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  pricing_preferences: z.record(z.any()).optional(),
});

const serviceAreaSchema = z.object({
  coordinates: z.array(z.array(z.number())).min(3),
});

// Get operator profile
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const operatorId = req.params.id === 'me' ? req.operatorId : req.params.id;

    const result = await query(
      `SELECT id, name, email, phone, equipment, capabilities, 
              pricing_preferences, created_at, updated_at,
              ST_AsGeoJSON(service_area) as service_area
       FROM operators WHERE id = $1`,
      [operatorId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Operator not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update operator profile
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const operatorId = req.params.id === 'me' ? req.operatorId : req.params.id;

    if (operatorId !== req.operatorId) {
      throw new AppError('Unauthorized', 403);
    }

    const updates = updateOperatorSchema.parse(req.body);
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.phone) {
      updateFields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    if (updates.equipment) {
      updateFields.push(`equipment = $${paramCount++}`);
      values.push(updates.equipment);
    }
    if (updates.capabilities) {
      updateFields.push(`capabilities = $${paramCount++}`);
      values.push(updates.capabilities);
    }
    if (updates.pricing_preferences) {
      updateFields.push(`pricing_preferences = $${paramCount++}`);
      values.push(JSON.stringify(updates.pricing_preferences));
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(operatorId);

    const result = await query(
      `UPDATE operators 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, email, phone, equipment, capabilities, pricing_preferences`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Set service area
router.post('/:id/service-area', async (req: AuthRequest, res, next) => {
  try {
    const operatorId = req.params.id === 'me' ? req.operatorId : req.params.id;

    if (operatorId !== req.operatorId) {
      throw new AppError('Unauthorized', 403);
    }

    const { coordinates } = serviceAreaSchema.parse(req.body);

    // Create PostGIS polygon from coordinates
    const polygonCoords = coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
    const polygonWKT = `POLYGON((${polygonCoords}))`;

    await query(
      `UPDATE operators 
       SET service_area = ST_GeomFromText($1, 4326),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [polygonWKT, operatorId]
    );

    res.json({ message: 'Service area updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
