/**
 * TwoFactorService
 *
 * Handles TOTP-based Two-Factor Authentication using otplib.
 * Flow:
 *   1. User calls enable-2fa → generates secret + QR code (not yet active)
 *   2. User scans QR with Google Authenticator / Authy
 *   3. User calls verify-2fa with the 6-digit code → 2FA is now active
 *   4. On login, if 2FA is enabled, user must provide the code
 *   5. User can call disable-2fa with a valid code to turn it off
 */

import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import * as otplib from 'otplib';
import * as qrcode from 'qrcode';
import { UserService } from '../../../users/application/services/user.service';
import { UserRepository } from '../../../users/repositories/user.repository';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly APP_NAME = 'Spendly Dashboard';

  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Step 1: Generate a TOTP secret and return a QR code for the user to scan.
   * Does NOT enable 2FA yet — the user must verify first.
   */
  async generateSecret(userId: string) {
    const user = await this.userService.findById(userId);
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const secret = otplib.generateSecret();

    // Save the secret (but don't enable 2FA yet)
    await this.userRepository.update(userId, { twoFactorSecret: secret } as any);

    // Generate the otpauth:// URI
    const otpauthUrl = otplib.generateURI({
      strategy: 'totp',
      secret,
      issuer: this.APP_NAME,
      label: user.email,
    });

    // Generate a QR code as a base64 data URL
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    return {
      secret,
      qrCode: qrCodeDataUrl,
      otpauthUrl,
    };
  }

  /**
   * Step 2: Verify the TOTP code and officially enable 2FA.
   */
  async verifyAndEnable(userId: string, code: string) {
    const user = await this.userService.findById(userId);

    if (!user.twoFactorSecret) {
      throw new BadRequestException('No 2FA secret found. Call enable-2fa first.');
    }

    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const verifyResult = await otplib.verify({ token: code, secret: user.twoFactorSecret });
    if (!verifyResult.valid) {
      throw new UnauthorizedException('Invalid 2FA code. Please try again.');
    }

    // Officially enable 2FA
    await this.userRepository.update(userId, { isTwoFactorEnabled: true } as any);

    this.logger.log(`2FA enabled for user ${userId}`);
    return { message: 'Two-factor authentication has been successfully enabled' };
  }

  /**
   * Step 3: Validate a TOTP code during login.
   */
  async validateCode(secret: string, code: string): Promise<boolean> {
    const result = await otplib.verify({ token: code, secret });
    return result.valid;
  }

  /**
   * Disable 2FA (requires a valid code to confirm identity).
   */
  async disable(userId: string, code: string) {
    const user = await this.userService.findById(userId);

    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const disableResult = await otplib.verify({ token: code, secret: user.twoFactorSecret });
    if (!disableResult.valid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.userRepository.update(userId, {
      isTwoFactorEnabled: false,
      twoFactorSecret: undefined,
    } as any);

    this.logger.log(`2FA disabled for user ${userId}`);
    return { message: 'Two-factor authentication has been disabled' };
  }
}

