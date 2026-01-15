import express from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import axios from 'axios';

const router = express.Router();

router.use(authenticate);

const optimizeRouteSchema = z.object({
  route_id: z.string().uuid(),
  algorithm: z.enum(['nearest_neighbor', 'genetic', 'simulated_annealing']).optional(),
});

// Optimize route
router.post('/route', async (req: AuthRequest, res, next) => {
  try {
    const { route_id, algorithm = 'nearest_neighbor' } = optimizeRouteSchema.parse(req.body);

    // Get route
    const routeResult = await query(
      `SELECT r.id, r.operator_id, r.waypoints, r.distance_km, r.duration_minutes,
              ST_AsGeoJSON(r.waypoints) as waypoints_geo
       FROM routes r
       WHERE r.id = $1 AND r.operator_id = $2`,
      [route_id, req.operatorId]
    );

    if (routeResult.rows.length === 0) {
      throw new AppError('Route not found', 404);
    }

    // Get waypoints
    const waypointsResult = await query(
      `SELECT id, sequence_order, ST_X(location) as longitude, ST_Y(location) as latitude,
              address, service_type, estimated_duration_minutes
       FROM route_waypoints
       WHERE route_id = $1
       ORDER BY sequence_order`,
      [route_id]
    );

    // Call optimization service
    const optimizationServiceUrl = process.env.OPTIMIZATION_SERVICE_URL || 'http://localhost:8000';
    
    try {
      const optimizationResponse = await axios.post(
        `${optimizationServiceUrl}/optimize`,
        {
          waypoints: waypointsResult.rows.map(wp => ({
            latitude: wp.latitude,
            longitude: wp.longitude,
            address: wp.address,
            service_type: wp.service_type,
            estimated_duration_minutes: wp.estimated_duration_minutes,
          })),
          algorithm,
        }
      );

      const optimizedWaypoints = optimizationResponse.data.optimized_waypoints;
      const optimizedDistance = optimizationResponse.data.distance_km;
      const optimizedDuration = optimizationResponse.data.duration_minutes;

      // Save optimization result
      const originalDistance = routeResult.rows[0].distance_km || 0;
      const originalDuration = routeResult.rows[0].duration_minutes || 0;
      const savings = originalDistance > 0
        ? ((originalDistance - optimizedDistance) / originalDistance) * 100
        : 0;

      // Create optimized LineString
      const lineStringCoords = optimizedWaypoints
        .map((wp: any) => `${wp.longitude} ${wp.latitude}`)
        .join(', ');
      const lineStringWKT = `LINESTRING(${lineStringCoords})`;

      await query(
        `INSERT INTO route_optimizations 
         (route_id, original_distance_km, optimized_distance_km, 
          original_duration_minutes, optimized_duration_minutes, 
          savings_percentage, optimization_algorithm, optimized_waypoints)
         VALUES ($1, $2, $3, $4, $5, $6, $7, ST_GeomFromText($8, 4326))`,
        [
          route_id,
          originalDistance,
          optimizedDistance,
          originalDuration,
          optimizedDuration,
          savings,
          algorithm,
          lineStringWKT,
        ]
      );

      // Update route
      await query(
        `UPDATE routes 
         SET waypoints = ST_GeomFromText($1, 4326),
             distance_km = $2,
             duration_minutes = $3,
             optimized = TRUE,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [lineStringWKT, optimizedDistance, optimizedDuration, route_id]
      );

      res.json({
        route_id,
        original_distance_km: originalDistance,
        optimized_distance_km: optimizedDistance,
        original_duration_minutes: originalDuration,
        optimized_duration_minutes: optimizedDuration,
        savings_percentage: savings,
        optimized_waypoints,
      });
    } catch (error: any) {
      if (error.response) {
        throw new AppError(
          `Optimization service error: ${error.response.data.message || 'Unknown error'}`,
          500
        );
      }
      throw new AppError('Failed to connect to optimization service', 503);
    }
  } catch (error) {
    next(error);
  }
});

// Get gap analysis
router.post('/gaps', async (req: AuthRequest, res, next) => {
  try {
    const { route_id } = req.body;

    if (!route_id) {
      throw new AppError('route_id is required', 400);
    }

    // Get route and waypoints
    const routeResult = await query(
      `SELECT r.id, r.operator_id, r.waypoints, r.distance_km
       FROM routes r
       WHERE r.id = $1 AND r.operator_id = $2`,
      [route_id, req.operatorId]
    );

    if (routeResult.rows.length === 0) {
      throw new AppError('Route not found', 404);
    }

    // Call optimization service for gap analysis
    const optimizationServiceUrl = process.env.OPTIMIZATION_SERVICE_URL || 'http://localhost:8000';
    
    try {
      const gapResponse = await axios.post(
        `${optimizationServiceUrl}/analyze-gaps`,
        {
          route_id,
          operator_id: req.operatorId,
        }
      );

      // Save gap analysis results
      for (const gap of gapResponse.data.gaps) {
        const pointWKT = `POINT(${gap.longitude} ${gap.latitude})`;
        await query(
          `INSERT INTO gap_analyses 
           (operator_id, route_id, gap_type, location, description, 
            suggested_improvement, potential_savings)
           VALUES ($1, $2, $3, ST_GeomFromText($4, 4326), $5, $6, $7)`,
          [
            req.operatorId,
            route_id,
            gap.gap_type,
            pointWKT,
            gap.description,
            gap.suggested_improvement,
            gap.potential_savings || 0,
          ]
        );
      }

      res.json(gapResponse.data);
    } catch (error: any) {
      if (error.response) {
        throw new AppError(
          `Gap analysis service error: ${error.response.data.message || 'Unknown error'}`,
          500
        );
      }
      throw new AppError('Failed to connect to optimization service', 503);
    }
  } catch (error) {
    next(error);
  }
});

// Get optimization suggestions
router.get('/suggestions', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT ga.id, ga.route_id, ga.gap_type, 
              ST_AsGeoJSON(ga.location) as location,
              ga.description, ga.suggested_improvement, ga.potential_savings,
              ga.created_at
       FROM gap_analyses ga
       WHERE ga.operator_id = $1
       ORDER BY ga.potential_savings DESC
       LIMIT 20`,
      [req.operatorId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
