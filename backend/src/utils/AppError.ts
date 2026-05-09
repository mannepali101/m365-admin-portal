import { RequestHandler, Request, Response, NextFunction } from 'express';

// -------------------------------------------------------------------
// AppError — operational errors that flow through the error handler
// -------------------------------------------------------------------
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// -------------------------------------------------------------------
// asyncHandler — wraps async route handlers to forward errors
// -------------------------------------------------------------------
export const asyncHandler = (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
