import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorBody {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { statusCode, message, errors } = this.resolve(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `${req.method} ${req.path} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${req.method} ${req.path} → ${statusCode}: ${message}`);
    }

    const body: ErrorBody = {
      success: false,
      statusCode,
      message,
      ...(errors !== undefined && { errors }),
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    res.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    message: string;
    errors?: Record<string, unknown>;
  } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const r = res as { message: string | string[]; error?: string };
        const messages = Array.isArray(r.message) ? r.message : [r.message];
        return {
          statusCode: exception.getStatus(),
          message: messages[0] ?? exception.message,
          ...(messages.length > 1 && { errors: { validation: messages } }),
        };
      }
      return { statusCode: exception.getStatus(), message: exception.message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Invalid database query' };
    }

    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }

  private mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
  } {
    switch (err.code) {
      case 'P2002':
        return { statusCode: HttpStatus.CONFLICT, message: 'A record with this value already exists' };
      case 'P2025':
        return { statusCode: HttpStatus.NOT_FOUND, message: 'Record not found' };
      case 'P2003':
        return { statusCode: HttpStatus.BAD_REQUEST, message: 'Referenced record does not exist' };
      case 'P2014':
        return { statusCode: HttpStatus.BAD_REQUEST, message: 'Required relation missing' };
      case 'P1001':
        return { statusCode: HttpStatus.SERVICE_UNAVAILABLE, message: 'Database unavailable' };
      default:
        this.logger.error(`Unhandled Prisma error ${err.code}: ${err.message}`);
        return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database error' };
    }
  }
}
