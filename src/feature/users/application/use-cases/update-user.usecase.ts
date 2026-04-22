/**
 * UpdateUserUseCase
 *
 * EXECUTION FLOW:
 * 1. VALIDATE: user exists
 * 2. UPDATE: apply partial update
 * 3. RETURN: updated user (without password)
 */

import { Injectable } from '@nestjs/common';

import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserDocument } from '../../schemas/user.schema';
import { UserValidationHelper } from '../../helpers/user-validation.helper';
import { UserRepository } from '../../repositories/user.repository';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly validationHelper: UserValidationHelper,
  ) {}

  async execute(userId: string, dto: UpdateUserDto): Promise<UserDocument> {
    // 1. Validate user exists
    await this.validationHelper.validateUserExists(userId);

    // 2. Build update payload
    const updateData: Partial<any> = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.avatar !== undefined) updateData.avatar = dto.avatar;

    // 3. Update and return
    const updated = await this.repository.update(userId, updateData);
    return updated!;
  }
}
