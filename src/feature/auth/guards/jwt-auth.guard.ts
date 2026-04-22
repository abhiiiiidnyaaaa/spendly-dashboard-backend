/**
 * JwtAuthGuard
 *
 * Route guard that protects endpoints using JWT authentication.
 * Usage: @UseGuards(JwtAuthGuard) on controller or individual routes.
 *
 * How it works:
 * 1. Intercepts incoming request
 * 2. Delegates to JwtStrategy for token validation
 * 3. If valid → req.user is populated, request proceeds
 * 4. If invalid → 401 Unauthorized is thrown
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
