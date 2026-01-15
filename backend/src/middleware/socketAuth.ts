import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ExtendedError } from 'socket.io/dist/namespace';

export const authenticateSocket = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string; operatorId: string };

    (socket as any).operatorId = decoded.operatorId;
    (socket as any).userId = decoded.userId;

    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};
