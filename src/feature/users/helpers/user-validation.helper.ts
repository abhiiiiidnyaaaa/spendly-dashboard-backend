/**
 * UserValidationHelper
 *
 * Encapsulates all server-side business validation for User entities.
 *
 * VALIDATIONS:
 * 1. Email uniqueness check (case-insensitive)
 * 2. User existence check
 */

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserDocument } from '../schemas/user.schema';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserValidationHelper {
  constructor(private readonly repository: UserRepository) {}

  /**
   * Validates that the email is not already registered
   */
  async validateEmailUniqueness(
    email: string,
    excludeId?: string,
  ): Promise<void> {
    const exists = await this.repository.existsByEmail(email, excludeId);
    if (exists) {
      throw new ConflictException('Email is already registered');
    }
  }

  /**
   * Validates that a user exists by ID and returns the document
   */
  async validateUserExists(userId: string): Promise<UserDocument> {
    const user = await this.repository.findByIdWithoutPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
