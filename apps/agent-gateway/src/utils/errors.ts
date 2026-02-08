/**
 * Error Classes
 * Custom error types for better error handling
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details?: unknown) {
    super(message, 401, 'AUTH_FAILED', details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = 'Rate limit exceeded',
    public retryAfter: number = 3600,
    details?: unknown
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    public service: string,
    message = 'External service error',
    details?: unknown
  ) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}
