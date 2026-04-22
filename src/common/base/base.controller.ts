import { HttpException, HttpStatus } from '@nestjs/common';

export abstract class BaseController {
  /**
   * Reusable error handler that wraps controller methods
   * Handles HttpExceptions by re-throwing, wraps other errors in HttpException
   *
   * @param handler - The async function to execute
   * @param errorMessage - Custom error message for non-HttpException errors
   * @returns The result of the handler function
   */
  protected async handleRequest<T>(
    handler: () => Promise<T>,
    errorMessage: string,
  ): Promise<T> {
    try {
      return await handler();
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        {
          message: errorMessage,
          error: {
            name: err?.name,
            message: err?.message,
            stack: err?.stack,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
