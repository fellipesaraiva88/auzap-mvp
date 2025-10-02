import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../validators/crud.validators';

/**
 * Middleware para validar request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateRequest(schema, req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors,
      });
    }

    // Substituir body com dados validados
    req.body = result.data;
    next();
  };
}

/**
 * Middleware para validar query params
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateRequest(schema, req.query);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors,
      });
    }

    // Substituir query com dados validados
    req.query = result.data as any;
    next();
  };
}

/**
 * Middleware para validar params
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateRequest(schema, req.params);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors,
      });
    }

    // Substituir params com dados validados
    req.params = result.data as any;
    next();
  };
}
