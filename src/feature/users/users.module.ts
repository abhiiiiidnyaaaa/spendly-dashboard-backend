/**
 * UsersModule
 *
 * NestJS module for User management.
 * Exports UserService so the Auth module can use it for login/registration.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResponseService } from '../../common/services/response.service';
import { User, UserSchema } from './schemas/user.schema';
import { UserRepository } from './repositories/user.repository';
import { UserValidationHelper } from './helpers/user-validation.helper';
import { CreateUserUseCase } from './application/use-cases/create-user.usecase';
import { FindUserUseCase } from './application/use-cases/find-user.usecase';
import { UpdateUserUseCase } from './application/use-cases/update-user.usecase';
import { UserService } from './application/services/user.service';
import { UserController } from './controller/user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [
    ResponseService,
    // Repository
    UserRepository,
    // Validation Helper
    UserValidationHelper,
    // Use Cases
    CreateUserUseCase,
    FindUserUseCase,
    UpdateUserUseCase,
    // Service
    UserService,
  ],
  exports: [UserService],
})
export class UsersModule {}
