import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './index';
import { logger } from './utils/logger';
import { authenticateSocket } from './middleware/socketAuth';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Socket authentication middleware
io.use(authenticateSocket);

io.on('connection', (socket) => {
  const operatorId = (socket as any).operatorId;
  logger.info('Client connected', { operatorId, socketId: socket.id });

  // Join operator's room for personalized updates
  socket.join(`operator:${operatorId}`);

  // Handle route updates
  socket.on('route:update', (data) => {
    logger.debug('Route update received', { operatorId, data });
    socket.to(`operator:${operatorId}`).emit('route:updated', data);
  });

  // Handle job notifications
  socket.on('job:subscribe', (jobId: string) => {
    socket.join(`job:${jobId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { operatorId, socketId: socket.id });
  });
});

// Export io for use in routes
export { io };

export default httpServer;
