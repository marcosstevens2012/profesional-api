import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface RequestWithId extends Request {
  requestId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const requestId = request.requestId;

    // Get detailed error information
    const errorDetails =
      exception instanceof Error
        ? {
            name: exception.name,
            message: exception.message,
            stack: exception.stack,
          }
        : exception;

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'string'
          ? message
          : (message as { message?: string }).message || 'Internal server error',
      requestId,
    };

    // Log with structured data - include full error details
    this.logger.error(`${request.method} ${request.url} - ${status}`, {
      req: {
        requestId,
        method: request.method,
        url: request.url,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
      },
      context: HttpExceptionFilter.name,
      errorDetails,
    });

    // If it's not an HttpException, log the full exception for debugging
    if (!(exception instanceof HttpException)) {
      this.logger.error('Unhandled exception details:', exception);
    }

    response.status(status).json(errorResponse);
  }
}
