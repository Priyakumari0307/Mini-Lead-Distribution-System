import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodObject } from 'zod';
type AnyZodObject = ZodObject<any, any>;
import { BadRequestError } from '../utils/errors';

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error instanceof ZodError || (error && error.name === 'ZodError')) {
        const issues = error.issues || error.errors || [];
        const errors = issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new BadRequestError('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.query);
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true
      });
      next();
    } catch (error: any) {
      if (error instanceof ZodError || (error && error.name === 'ZodError')) {
        const issues = error.issues || error.errors || [];
        const errors = issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new BadRequestError('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
};
