import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  statusCode: number;
  timestamp: string;
  details?: unknown;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  let details: unknown;

  // Operational errors (AppError instances)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  }

  // Zod validation errors → 400
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.flatten().fieldErrors;
  }

  // Microsoft Graph API errors
  else if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
    const graphErr = err as any;
    statusCode = graphErr.statusCode;
    message = graphErr.message ?? 'Microsoft Graph API error';
    code = graphErr.code ?? 'GRAPH_ERROR';
  }

  // Unknown errors — log in full, expose minimal detail
  else {
    console.error('[Unhandled Error]', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
    message =
      process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  }

  const body: ErrorResponse = {
    success: false,
    error: message,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
    ...(details ? { details } : {}),
  };

  res.status(statusCode).json(body);
}
