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
        details: 'errors' in result ? result.errors : [],
      });
    }

    // Substituir body com dados validados
    req.body = 'data' in result ? result.data : req.body;
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
        details: 'errors' in result ? result.errors : [],
      });
    }

    // Substituir query com dados validados
    req.query = ('data' in result ? result.data : req.query) as any;
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
        details: 'errors' in result ? result.errors : [],
      });
    }

    // Substituir params com dados validados
    req.params = ('data' in result ? result.data : req.params) as any;
    next();
  };
}
