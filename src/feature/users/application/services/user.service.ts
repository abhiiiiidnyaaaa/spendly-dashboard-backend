/**
 * UserService
 *
 * Service layer that delegates to individual use cases.
 * Also exposes repository methods needed by the Auth module.
 */

import { Injectable } from '@nestjs/common';

import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserDocument } from '../../schemas/user.schema';
import { UserRepository } from '../../repositories/user.repository';
import { CreateUserUseCase } from '../use-cases/create-user.usecase';
import { FindUserUseCase } from '../use-cases/find-user.usecase';
import { UpdateUserUseCase } from '../use-cases/update-user.usecase';

@Injectable()
export class UserService {
  constructor(
    private readonly createUseCase: CreateUserUseCase,
    private readonly findUseCase: FindUserUseCase,
    private readonly updateUseCase: UpdateUserUseCase,
    private readonly repository: UserRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    return this.createUseCase.execute(dto);
  }

  async findById(userId: string): Promise<UserDocument> {
    return this.findUseCase.execute(userId);
  }

  async update(userId: string, dto: UpdateUserDto): Promise<UserDocument> {
    return this.updateUseCase.execute(userId, dto);
  }

  /**
   * Used by Auth module for login – needs password for comparison
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.repository.findByEmail(email);
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.repository.findByResetToken(token);
  }
}
