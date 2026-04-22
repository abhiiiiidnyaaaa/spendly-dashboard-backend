/**
 * AuthController
 *
 * REST API endpoints for user authentication.
 * Routes: /auth
 */

import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthService } from '../application/services/auth.service';

@Controller('auth')
export class AuthController extends BaseController {
  constructor(
    private readonly authService: AuthService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.authService.register(dto);
      
      this.responseService.sendResponse(
        res,
        HttpStatus.CREATED,
        result,
        'User registered successfully',
      );
    }, 'Error occurred during registration');
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.authService.login(dto);

      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        result,
        'Logged in successfully',
      );
    }, 'Error occurred during login');
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.authService.forgotPassword(dto);
      this.responseService.sendResponse(res, HttpStatus.OK, result, result.message);
    }, 'Error processing forgot password request');
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.authService.resetPassword(dto);
      this.responseService.sendResponse(res, HttpStatus.OK, null, result.message);
    }, 'Error resetting password');
  }
}
