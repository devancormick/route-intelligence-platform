import express from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

router.use(authenticate);

// Get operator analytics
router.get('/operator', async (req: AuthRequest, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params: any[] = [req.operatorId];
    let paramCount = 2;

    if (startDate && endDate) {
      dateFilter = `AND r.created_at BETWEEN $${paramCount++} AND $${paramCount++}`;
      params.push(startDate, endDate);
    }

    // Total routes
    const routesResult = await query(
      `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN optimized THEN 1 END) as optimized_count,
              SUM(distance_km) as total_distance,
              SUM(duration_minutes) as total_duration
       FROM routes r
       WHERE r.operator_id = $1 ${dateFilter}`,
      params
    );

    // Average route metrics
    const avgResult = await query(
      `SELECT AVG(distance_km) as avg_distance,
              AVG(duration_minutes) as avg_duration,
              AVG(CASE WHEN optimized THEN distance_km END) as avg_optimized_distance
       FROM routes r
       WHERE r.operator_id = $1 ${dateFilter}`,
      params
    );

    // Jobs statistics
    const jobsResult = await query(
      `SELECT COUNT(*) as total_jobs,
              COUNT(CASE WHEN status = 'open' THEN 1 END) as open_jobs,
              COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned_jobs,
              SUM(CASE WHEN assigned_to = $1 THEN budget ELSE 0 END) as total_revenue
       FROM jobs j
       WHERE j.created_by = $1 OR j.assigned_to = $1 ${dateFilter.replace('r.', 'j.')}`,
      params
    );

    // Bids statistics
    const bidsResult = await query(
      `SELECT COUNT(*) as total_bids,
              COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_bids,
              AVG(amount) as avg_bid_amount
       FROM bids b
       WHERE b.operator_id = $1 ${dateFilter.replace('r.', 'b.')}`,
      params
    );

    // Route optimization savings
    const savingsResult = await query(
      `SELECT AVG(savings_percentage) as avg_savings,
              SUM(original_distance_km - optimized_distance_km) as total_distance_saved,
              SUM(original_duration_minutes - optimized_duration_minutes) as total_time_saved
       FROM route_optimizations ro
       JOIN routes r ON ro.route_id = r.id
       WHERE r.operator_id = $1 ${dateFilter.replace('r.created_at', 'ro.created_at')}`,
      params
    );

    // Recent activity
    const recentRoutes = await query(
      `SELECT id, name, distance_km, duration_minutes, optimized, created_at
       FROM routes
       WHERE operator_id = $1 ${dateFilter}
       ORDER BY created_at DESC
       LIMIT 10`,
      params
    );

    res.json({
      routes: {
        total: parseInt(routesResult.rows[0].total),
        optimized: parseInt(routesResult.rows[0].optimized_count),
        totalDistance: parseFloat(routesResult.rows[0].total_distance || 0),
        totalDuration: parseInt(routesResult.rows[0].total_duration || 0),
        averageDistance: parseFloat(avgResult.rows[0].avg_distance || 0),
        averageDuration: parseFloat(avgResult.rows[0].avg_duration || 0),
        averageOptimizedDistance: parseFloat(avgResult.rows[0].avg_optimized_distance || 0),
      },
      jobs: {
        total: parseInt(jobsResult.rows[0].total_jobs || 0),
        open: parseInt(jobsResult.rows[0].open_jobs || 0),
        assigned: parseInt(jobsResult.rows[0].assigned_jobs || 0),
        totalRevenue: parseFloat(jobsResult.rows[0].total_revenue || 0),
      },
      bids: {
        total: parseInt(bidsResult.rows[0].total_bids || 0),
        accepted: parseInt(bidsResult.rows[0].accepted_bids || 0),
        averageAmount: parseFloat(bidsResult.rows[0].avg_bid_amount || 0),
      },
      optimization: {
        averageSavings: parseFloat(savingsResult.rows[0].avg_savings || 0),
        totalDistanceSaved: parseFloat(savingsResult.rows[0].total_distance_saved || 0),
        totalTimeSaved: parseInt(savingsResult.rows[0].total_time_saved || 0),
      },
      recentRoutes: recentRoutes.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Get route performance metrics
router.get('/routes/performance', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as route_count,
        AVG(distance_km) as avg_distance,
        AVG(duration_minutes) as avg_duration,
        COUNT(CASE WHEN optimized THEN 1 END) as optimized_count
       FROM routes
       WHERE operator_id = $1
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY date DESC`,
      [req.operatorId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get pricing trends
router.get('/pricing/trends', async (req: AuthRequest, res, next) => {
  try {
    const { job_type } = req.query;
    
    let queryText = `
      SELECT 
        DATE_TRUNC('month', timestamp) as month,
        job_type,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        COUNT(*) as data_points
      FROM pricing_history
      WHERE operator_id = $1
    `;
    const params: any[] = [req.operatorId];

    if (job_type) {
      queryText += ' AND job_type = $2';
      params.push(job_type);
    }

    queryText += `
      GROUP BY DATE_TRUNC('month', timestamp), job_type
      ORDER BY month DESC
      LIMIT 12
    `;

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
