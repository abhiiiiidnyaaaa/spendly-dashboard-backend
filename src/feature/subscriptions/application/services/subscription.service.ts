import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionRepository } from '../../repositories/subscription.repository';
import { CreateSubscriptionDto } from '../../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../../dto/update-subscription.dto';
import { SubscriptionDocument } from '../../schemas/subscription.schema';

@Injectable()
export class SubscriptionService {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async create(userId: string, data: CreateSubscriptionDto): Promise<SubscriptionDocument> {
    return this.subscriptionRepository.create(userId, data);
  }

  async findAll(userId: string): Promise<SubscriptionDocument[]> {
    return this.subscriptionRepository.findAll(userId);
  }

  async findOne(userId: string, id: string): Promise<SubscriptionDocument> {
    const sub = await this.subscriptionRepository.findOne(userId, id);
    if (!sub) {
      throw new NotFoundException(`Subscription #${id} not found`);
    }
    return sub;
  }

  async update(userId: string, id: string, data: UpdateSubscriptionDto): Promise<SubscriptionDocument> {
    const sub = await this.subscriptionRepository.update(userId, id, data);
    if (!sub) {
      throw new NotFoundException(`Subscription #${id} not found`);
    }
    return sub;
  }

  async remove(userId: string, id: string): Promise<SubscriptionDocument> {
    const sub = await this.subscriptionRepository.remove(userId, id);
    if (!sub) {
      throw new NotFoundException(`Subscription #${id} not found`);
    }
    return sub;
  }
}
