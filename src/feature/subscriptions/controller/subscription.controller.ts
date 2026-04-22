import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from '../application/services/subscription.service';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.create(req.user?.id || req.user?.sub, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.subscriptionService.findAll(req.user?.id || req.user?.sub);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.subscriptionService.findOne(req.user?.id || req.user?.sub, id);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionService.update(req.user?.id || req.user?.sub, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.subscriptionService.remove(req.user?.id || req.user?.sub, id);
  }
}
