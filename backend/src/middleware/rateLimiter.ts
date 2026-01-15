import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimiter = (windowMs: number = 60000, maxRequests: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    if (store[key].count >= maxRequests) {
      return next(new AppError('Too many requests, please try again later', 429));
    }

    store[key].count++;
    next();
  };
};
