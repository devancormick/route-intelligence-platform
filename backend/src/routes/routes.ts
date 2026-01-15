import express from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = express.Router();

router.use(authenticate);

const createRouteSchema = z.object({
  name: z.string().optional(),
  waypoints: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
    service_type: z.string().optional(),
    estimated_duration_minutes: z.number().optional(),
  })),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

// Create route
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { name, waypoints, start_time, end_time } = createRouteSchema.parse(req.body);

    if (waypoints.length < 2) {
      throw new AppError('Route must have at least 2 waypoints', 400);
    }

    // Create PostGIS LineString from waypoints
    const lineStringCoords = waypoints
      .map(wp => `${wp.longitude} ${wp.latitude}`)
      .join(', ');
    const lineStringWKT = `LINESTRING(${lineStringCoords})`;

    // Calculate distance and duration using PostGIS
    const distance = await calculateRouteDistance(waypoints);
    const duration = await calculateRouteDuration(waypoints);

    const result = await query(
      `INSERT INTO routes (operator_id, name, waypoints, start_time, end_time, distance_km, duration_minutes)
       VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5, $6, $7)
       RETURNING id, name, operator_id, start_time, end_time, distance_km, duration_minutes, created_at`,
      [
        req.operatorId,
        name || null,
        lineStringWKT,
        start_time || null,
        end_time || null,
        distance,
        duration,
      ]
    );

    const route = result.rows[0];

    // Insert waypoints
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const pointWKT = `POINT(${wp.longitude} ${wp.latitude})`;
      await query(
        `INSERT INTO route_waypoints (route_id, sequence_order, location, address, service_type, estimated_duration_minutes)
         VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5, $6)`,
        [
          route.id,
          i + 1,
          pointWKT,
          wp.address || null,
          wp.service_type || null,
          wp.estimated_duration_minutes || null,
        ]
      );
    }

    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
});

// Get routes
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT r.id, r.name, r.operator_id, r.start_time, r.end_time, 
              r.distance_km, r.duration_minutes, r.optimized, r.created_at,
              ST_AsGeoJSON(r.waypoints) as waypoints
       FROM routes r
       WHERE r.operator_id = $1
       ORDER BY r.created_at DESC`,
      [req.operatorId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get route by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT r.id, r.name, r.operator_id, r.start_time, r.end_time,
              r.distance_km, r.duration_minutes, r.optimized, r.created_at,
              ST_AsGeoJSON(r.waypoints) as waypoints
       FROM routes r
       WHERE r.id = $1 AND r.operator_id = $2`,
      [req.params.id, req.operatorId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Route not found', 404);
    }

    // Get waypoints
    const waypointsResult = await query(
      `SELECT id, sequence_order, ST_AsGeoJSON(location) as location,
              address, service_type, estimated_duration_minutes, notes
       FROM route_waypoints
       WHERE route_id = $1
       ORDER BY sequence_order`,
      [req.params.id]
    );

    res.json({
      ...result.rows[0],
      waypoints: waypointsResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Delete route
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      'DELETE FROM routes WHERE id = $1 AND operator_id = $2 RETURNING id',
      [req.params.id, req.operatorId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Route not found', 404);
    }

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Upload route from file
router.post('/upload', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const waypoints = await parseRouteFile(req.file);
    
    if (waypoints.length < 2) {
      throw new AppError('File must contain at least 2 waypoints', 400);
    }

    const lineStringCoords = waypoints
      .map(wp => `${wp.longitude} ${wp.latitude}`)
      .join(', ');
    const lineStringWKT = `LINESTRING(${lineStringCoords})`;

    const distance = await calculateRouteDistance(waypoints);
    const duration = await calculateRouteDuration(waypoints);

    const result = await query(
      `INSERT INTO routes (operator_id, name, waypoints, distance_km, duration_minutes)
       VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5)
       RETURNING id, name, operator_id, distance_km, duration_minutes, created_at`,
      [
        req.operatorId,
        req.file.originalname.replace(/\.[^/.]+$/, ''),
        lineStringWKT,
        distance,
        duration,
      ]
    );

    const route = result.rows[0];

    // Insert waypoints
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const pointWKT = `POINT(${wp.longitude} ${wp.latitude})`;
      await query(
        `INSERT INTO route_waypoints (route_id, sequence_order, location, address, service_type, estimated_duration_minutes)
         VALUES ($1, $2, ST_GeomFromText($3, 4326), $4, $5, $6)`,
        [
          route.id,
          i + 1,
          pointWKT,
          wp.address || null,
          wp.service_type || null,
          wp.estimated_duration_minutes || null,
        ]
      );
    }

    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
});

// Update route
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { name, waypoints, start_time, end_time } = req.body;

    // Check if route exists and belongs to operator
    const existingRoute = await query(
      'SELECT id FROM routes WHERE id = $1 AND operator_id = $2',
      [req.params.id, req.operatorId]
    );

    if (existingRoute.rows.length === 0) {
      throw new AppError('Route not found', 404);
    }

    let updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (waypoints && Array.isArray(waypoints) && waypoints.length >= 2) {
      const lineStringCoords = waypoints
        .map((wp: any) => `${wp.longitude} ${wp.latitude}`)
        .join(', ');
      const lineStringWKT = `LINESTRING(${lineStringCoords})`;
      
      const distance = await calculateRouteDistance(waypoints);
      const duration = await calculateRouteDuration(waypoints);

      updateFields.push(`waypoints = ST_GeomFromText($${paramCount++}, 4326)`);
      values.push(lineStringWKT);
      updateFields.push(`distance_km = $${paramCount++}`);
      values.push(distance);
      updateFields.push(`duration_minutes = $${paramCount++}`);
      values.push(duration);
    }

    if (start_time !== undefined) {
      updateFields.push(`start_time = $${paramCount++}`);
      values.push(start_time);
    }

    if (end_time !== undefined) {
      updateFields.push(`end_time = $${paramCount++}`);
      values.push(end_time);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const result = await query(
      `UPDATE routes 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, operator_id, start_time, end_time, distance_km, duration_minutes, updated_at`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
