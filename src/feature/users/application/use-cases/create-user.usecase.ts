/**
 * CreateUserUseCase
 *
 * EXECUTION FLOW:
 * 1. VALIDATE: email uniqueness
 * 2. HASH: password using bcrypt
 * 3. CREATE: persist user record
 * 4. RETURN: created user (without password)
 */

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from '../../dto/create-user.dto';
import { UserDocument } from '../../schemas/user.schema';
import { UserValidationHelper } from '../../helpers/user-validation.helper';
import { UserRepository } from '../../repositories/user.repository';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly validationHelper: UserValidationHelper,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserDocument> {
    // 1. Validate email uniqueness
    await this.validationHelper.validateEmailUniqueness(dto.email);

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 3. Create user
    const user = await this.repository.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      password: hashedPassword,
    });

    // 4. Return without password
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }
}
