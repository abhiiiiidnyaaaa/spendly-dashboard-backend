/**
 * AuthController
 *
 * REST API endpoints for user authentication & 2FA.
 * Routes: /auth
 */

import { Body, Controller, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { Verify2faDto } from '../dto/verify-2fa.dto';
import { AuthService } from '../application/services/auth.service';
import { TwoFactorService } from '../application/services/two-factor.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController extends BaseController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
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
  @ApiOperation({ summary: 'Login with email/password (optionally with 2FA code)' })
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
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.authService.forgotPassword(dto);
      this.responseService.sendResponse(res, HttpStatus.OK, result, result.message);
    }, 'Error processing forgot password request');
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using a token' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.authService.resetPassword(dto);
      this.responseService.sendResponse(res, HttpStatus.OK, null, result.message);
    }, 'Error resetting password');
  }

  // ==================== Two-Factor Authentication ====================

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA secret and QR code (Step 1)' })
  async enable2fa(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.twoFactorService.generateSecret(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, result, 'Scan the QR code with your authenticator app');
    }, 'Error enabling 2FA');
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify TOTP code and activate 2FA (Step 2)' })
  async verify2fa(@Req() req: any, @Body() dto: Verify2faDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.twoFactorService.verifyAndEnable(req.user.id, dto.code);
      this.responseService.sendResponse(res, HttpStatus.OK, result, result.message);
    }, 'Error verifying 2FA code');
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA (requires valid TOTP code)' })
  async disable2fa(@Req() req: any, @Body() dto: Verify2faDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.twoFactorService.disable(req.user.id, dto.code);
      this.responseService.sendResponse(res, HttpStatus.OK, result, result.message);
    }, 'Error disabling 2FA');
  }
}

