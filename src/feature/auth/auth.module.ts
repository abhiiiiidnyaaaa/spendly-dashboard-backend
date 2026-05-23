import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { BillingModule } from '../billing/billing.module';
import { ResponseService } from '../../common/services/response.service';
import { AuthService } from './application/services/auth.service';
import { TwoFactorService } from './application/services/two-factor.service';
import { AuthController } from './controller/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // Import UsersModule to use UserService
    UsersModule,
    BillingModule,
    PassportModule,
    // Async JWT configuration using ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: '24h' // Token expires in 24 hours
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    ResponseService,
    AuthService,
    TwoFactorService,
    JwtStrategy,
  ],
  exports: [AuthService], // Exported in case other modules need it
})
export class AuthModule {}
