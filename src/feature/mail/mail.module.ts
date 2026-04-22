/**
 * MailModule
 *
 * Configures the NestJS Mailer with Gmail SMTP transport.
 * Uses Handlebars for email templates.
 *
 * REQUIRED ENV VARIABLES:
 *  - SMTP_USER: Your Gmail address (e.g. yourname@gmail.com)
 *  - SMTP_PASS: Your Gmail App Password (16-char from Google Account)
 *  - FRONTEND_URL: (optional) Frontend URL for email links, defaults to http://localhost:3000
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';

import { MailService } from './application/services/mail.service';

@Global() // Make MailService available everywhere without importing MailModule
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // true for 465, false for 587 (STARTTLS)
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"SaaS Dashboard" <${configService.get<string>('SMTP_USER')}>`,
        },
        template: {
          dir: process.cwd() + '/src/feature/mail/templates', // Use direct src path for templates during dev
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
