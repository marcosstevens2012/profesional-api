import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    const requestId = (request as any).requestId;

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === "string" ? message : (message as any).message,
      requestId,
    };

    // Log with structured data
    this.logger.error(`${request.method} ${request.url} - ${status}`, {
      requestId,
      status,
      method: request.method,
      url: request.url,
      userAgent: request.get("User-Agent"),
      ip: request.ip,
      error: exception instanceof Error ? exception.stack : exception,
    });

    response.status(status).json(errorResponse);
  }
}
