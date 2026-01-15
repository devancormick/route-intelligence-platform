import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { mapService } from '../services/mapService';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = express.Router();

router.use(authenticate);

const directionsSchema = z.object({
  waypoints: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })).min(2),
  profile: z.enum(['driving', 'walking', 'cycling']).optional(),
});

const geocodeSchema = z.object({
  address: z.string().min(1),
});

const reverseGeocodeSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

// Get directions
router.post('/directions', async (req: AuthRequest, res, next) => {
  try {
    const { waypoints, profile = 'driving' } = directionsSchema.parse(req.body);
    
    const directions = await mapService.getDirections(waypoints, profile);
    res.json(directions);
  } catch (error) {
    next(error);
  }
});

// Geocode address
router.post('/geocode', async (req: AuthRequest, res, next) => {
  try {
    const { address } = geocodeSchema.parse(req.body);
    
    const result = await mapService.geocodeAddress(address);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Reverse geocode
router.post('/reverse-geocode', async (req: AuthRequest, res, next) => {
  try {
    const { latitude, longitude } = reverseGeocodeSchema.parse(req.body);
    
    const address = await mapService.reverseGeocode(latitude, longitude);
    res.json({ address });
  } catch (error) {
    next(error);
  }
});

// Get isochrones
router.post('/isochrones', async (req: AuthRequest, res, next) => {
  try {
    const { center, contoursMinutes, profile = 'driving' } = req.body;
    
    if (!center || !contoursMinutes || !Array.isArray(contoursMinutes)) {
      throw new AppError('Invalid isochrone parameters', 400);
    }

    const isochrones = await mapService.getIsochrones(center, contoursMinutes, profile);
    res.json(isochrones);
  } catch (error) {
    next(error);
  }
});

export default router;
