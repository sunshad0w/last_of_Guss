import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Глобальный фильтр для обработки HTTP исключений
 *
 * Обеспечивает единообразный формат ответов об ошибках
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      message:
        typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? exceptionResponse.message
          : exception.message,
      error:
        typeof exceptionResponse === 'object' && 'error' in exceptionResponse
          ? exceptionResponse.error
          : HttpStatus[status],
    };

    response.status(status).json(errorResponse);
  }
}
