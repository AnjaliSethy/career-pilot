import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

/** Centralized error handling: safe messages for clients, full detail in logs. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      return res.status(status).json(typeof body === 'string' ? { statusCode: status, message: body } : body);
    }
    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ statusCode: 500, message: 'Internal server error' });
  }
}
