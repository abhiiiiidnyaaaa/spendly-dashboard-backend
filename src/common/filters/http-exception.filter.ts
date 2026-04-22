import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'Internal Server Error';

    // Handle class-validator messages (which normally come as an array inside exceptionResponse.message)
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as any).message;
      if (Array.isArray(msg)) {
        message = msg[0]; // Take the first validation error to keep UI clean
      } else if (typeof msg === 'string') {
        message = msg;
      }
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    // Force our standard response shape!
    response.status(status).json({
      status,
      data: null,
      message,
      success: false,
    });
  }
}
