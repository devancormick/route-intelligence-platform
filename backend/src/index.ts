import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import operatorRoutes from './routes/operators';
import routeRoutes from './routes/routes';
import jobRoutes from './routes/jobs';
import optimizationRoutes from './routes/optimization';
import pricingRoutes from './routes/pricing';
import mapRoutes from './routes/maps';
import { rateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter(60000, 100)); // 100 requests per minute

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/optimize', optimizationRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/maps', mapRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
