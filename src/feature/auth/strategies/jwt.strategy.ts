/**
 * JwtStrategy
 *
 * Passport strategy for validating JWT tokens.
 *
 * FLOW:
 * 1. Extracts JWT from Authorization header (Bearer token)
 * 2. Verifies signature using JWT_SECRET from .env
 * 3. Decodes payload and attaches { id, email, role } to req.user
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserService } from '../../users/application/services/user.service';

interface JwtPayload {
  sub: string;   // userId
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
    });
  }

  /**
   * Called after JWT is verified. The return value is attached to req.user
   */
  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
