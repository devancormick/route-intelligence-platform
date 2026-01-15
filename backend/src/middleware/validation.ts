import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from './errorHandler';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(new AppError(`Validation error: ${errors.map(e => e.message).join(', ')}`, 400));
      }
      next(error);
    }
  };
};
