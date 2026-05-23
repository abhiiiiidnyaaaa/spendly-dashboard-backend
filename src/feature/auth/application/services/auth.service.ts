/**
 * AuthService
 *
 * Handles business logic for authentication.
 * 
 * EXECUTION FLOW:
 * - Register: delegates to UserService.create(), sends welcome email
 * - Login: validates email/password, generates JWT token
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserService } from '../../../users/application/services/user.service';
import { MailService } from '../../../mail/application/services/mail.service';
import { TwoFactorService } from './two-factor.service';
import { RazorpayService } from '../../../billing/application/services/razorpay.service';
import { RegisterDto } from '../../dto/register.dto';
import { LoginDto } from '../../dto/login.dto';
import { ForgotPasswordDto } from '../../dto/forgot-password.dto';
import { ResetPasswordDto } from '../../dto/reset-password.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly twoFactorService: TwoFactorService,
    private readonly razorpayService: RazorpayService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Delegate user creation to UserService
    const user = await this.userService.create(dto);

    // 2. Create Razorpay Customer and update user
    try {
      const customerId = await this.razorpayService.createCustomer(user.name, user.email);
      await this.userService.update(user._id.toString(), { razorpayCustomerId: customerId });
      user.razorpayCustomerId = customerId;
    } catch (err) {
      console.error('Warning: Razorpay customer creation failed for new user', err);
    }

    // 3. Send welcome email (fire-and-forget — won't block registration)
    this.mailService.sendWelcomeEmail(dto.email, dto.name);

    // 4. Automatically generate token upon registration
    const token = this.generateToken(user);
    
    return {
      user,
      access_token: token,
    };
  }

  async login(dto: LoginDto & { twoFactorCode?: string }) {
    // 1. Find user by email (we need the password field here)
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      if (!dto.twoFactorCode) {
        // Tell the frontend that 2FA is required
        return {
          requiresTwoFactor: true,
          message: 'Two-factor authentication code required',
        };
      }

      // Validate the TOTP code
      const isCodeValid = await this.twoFactorService.validateCode(
        user.twoFactorSecret!,
        dto.twoFactorCode,
      );
      if (!isCodeValid) {
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    // 4. Generate JWT
    const token = this.generateToken(user);

    // 5. Return user info (strip password & 2FA secret) and token
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorSecret;

    return {
      user: userObj,
      access_token: token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      // Return true to avoid email enumeration attacks
      return { message: 'If that email exists, we sent a password reset link to it.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await this.mailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    return { message: 'If that email exists, we sent a password reset link to it.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userService.findByResetToken(dto.token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password has been successfully updated' };
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
