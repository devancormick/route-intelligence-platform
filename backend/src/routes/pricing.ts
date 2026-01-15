import express from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = express.Router();

router.use(authenticate);

const pricingAnalysisSchema = z.object({
  job_type: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  service_area: z.string().optional(),
});

// Get pricing recommendations
router.get('/recommendations', async (req: AuthRequest, res, next) => {
  try {
    const { job_type, latitude, longitude, service_area } = req.query;

    if (!job_type || !latitude || !longitude) {
      throw new AppError('job_type, latitude, and longitude are required', 400);
    }

    const pointWKT = `POINT(${longitude} ${latitude})`;

    // Get historical pricing data within radius (50km)
    const result = await query(
      `SELECT ph.price, ph.job_type, ph.service_area,
              ST_Distance(ph.location, ST_GeomFromText($1, 4326)) * 111 AS distance_km
       FROM pricing_history ph
       WHERE ph.job_type = $2
         AND ST_DWithin(
           ph.location::geography,
           ST_GeomFromText($1, 4326)::geography,
           50000
         )
       ORDER BY distance_km, ph.timestamp DESC
       LIMIT 100`,
      [pointWKT, job_type]
    );

    if (result.rows.length === 0) {
      return res.json({
        recommendation: null,
        message: 'No pricing data available for this area and job type',
      });
    }

    // Calculate average and median prices
    const prices = result.rows.map((r) => parseFloat(r.price));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const sortedPrices = prices.sort((a, b) => a - b);
    const medianPrice =
      sortedPrices.length % 2 === 0
        ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
        : sortedPrices[Math.floor(sortedPrices.length / 2)];

    // Get min and max
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    res.json({
      recommendation: {
        average: avgPrice,
        median: medianPrice,
        min: minPrice,
        max: maxPrice,
        sample_size: result.rows.length,
      },
      data_points: result.rows.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
});

// Analyze pricing
router.post('/analyze', async (req: AuthRequest, res, next) => {
  try {
    const { job_type, latitude, longitude, service_area } = pricingAnalysisSchema.parse(req.body);

    const pointWKT = `POINT(${longitude} ${latitude})`;

    // Get operator's pricing history
    const operatorHistory = await query(
      `SELECT price, timestamp, ST_AsGeoJSON(location) as location
       FROM pricing_history
       WHERE operator_id = $1 AND job_type = $2
       ORDER BY timestamp DESC
       LIMIT 50`,
      [req.operatorId, job_type]
    );

    // Get market pricing
    const marketResult = await query(
      `SELECT ph.price, ph.timestamp,
              ST_Distance(ph.location, ST_GeomFromText($1, 4326)) * 111 AS distance_km
       FROM pricing_history ph
       WHERE ph.job_type = $2
         AND ph.operator_id != $3
         AND ST_DWithin(
           ph.location::geography,
           ST_GeomFromText($1, 4326)::geography,
           50000
         )
       ORDER BY distance_km, ph.timestamp DESC
       LIMIT 100`,
      [pointWKT, job_type, req.operatorId]
    );

    const marketPrices = marketResult.rows.map((r) => parseFloat(r.price));
    const operatorPrices = operatorHistory.rows.map((r) => parseFloat(r.price));

    const marketAvg = marketPrices.length > 0
      ? marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length
      : null;
    const operatorAvg = operatorPrices.length > 0
      ? operatorPrices.reduce((a, b) => a + b, 0) / operatorPrices.length
      : null;

    res.json({
      operator_pricing: {
        average: operatorAvg,
        history_count: operatorHistory.rows.length,
        recent_prices: operatorPrices.slice(0, 10),
      },
      market_pricing: {
        average: marketAvg,
        sample_size: marketPrices.length,
        price_range: marketPrices.length > 0
          ? {
              min: Math.min(...marketPrices),
              max: Math.max(...marketPrices),
            }
          : null,
      },
      comparison: marketAvg && operatorAvg
        ? {
            difference: operatorAvg - marketAvg,
            difference_percentage: ((operatorAvg - marketAvg) / marketAvg) * 100,
            recommendation:
              operatorAvg > marketAvg * 1.1
                ? 'Your prices are significantly higher than market average'
                : operatorAvg < marketAvg * 0.9
                ? 'Your prices are below market average - consider increasing'
                : 'Your prices are competitive with market average',
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

// Get pricing history
router.get('/history', async (req: AuthRequest, res, next) => {
  try {
    const { job_type, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT id, job_type, price, service_area, timestamp,
             ST_AsGeoJSON(location) as location
      FROM pricing_history
      WHERE operator_id = $1
    `;
    const params: any[] = [req.operatorId];
    let paramCount = 2;

    if (job_type) {
      queryText += ` AND job_type = $${paramCount++}`;
      params.push(job_type);
    }

    queryText += ` ORDER BY timestamp DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
