/**
 * FindUserUseCase
 *
 * EXECUTION FLOW:
 * 1. VALIDATE: user exists
 * 2. RETURN: user document (without password)
 */

import { Injectable } from '@nestjs/common';

import { UserDocument } from '../../schemas/user.schema';
import { UserValidationHelper } from '../../helpers/user-validation.helper';

@Injectable()
export class FindUserUseCase {
  constructor(private readonly validationHelper: UserValidationHelper) {}

  async execute(userId: string): Promise<UserDocument> {
    return this.validationHelper.validateUserExists(userId);
  }
}
