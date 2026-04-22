import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class ResponseService {
  /**
   * Sends a success response with consistent format
   * @param res - Express Response object
   * @param statusCode - HTTP status code (200, 201, etc.)
   * @param data - Response data payload
   * @param message - Success message
   */
  sendResponse(res: Response, statusCode: number, data: any, message: string) {
    res.status(statusCode).json({
      status: statusCode,
      data: data,
      message: message,
      success: true,
    });
  }

  /**
   * Sends an error response with consistent format
   * @param res - Express Response object
   * @param statusCode - HTTP status code (400, 404, 500, etc.)
   * @param message - Error message
   */
  sendErrorResponse(res: Response, statusCode: number, message: string) {
    res.status(statusCode).json({
      status: statusCode,
      data: null,
      message: message,
      success: false,
    });
  }
}
