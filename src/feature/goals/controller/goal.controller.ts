import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Req, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { GoalService } from '../application/services/goal.service';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import { AddFundsDto } from '../dto/add-funds.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Goals')
@ApiBearerAuth()
@Controller('api/v1/goals')
@UseGuards(JwtAuthGuard)
export class GoalController extends BaseController {
  constructor(
    private readonly goalService: GoalService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateGoalDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.goalService.create(req.user.id, dto);
      this.responseService.sendResponse(res, HttpStatus.CREATED, data, 'Goal created successfully');
    }, 'Failed to create goal');
  }

  @Get()
  async findAll(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.goalService.findAll(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Goals retrieved successfully');
    }, 'Failed to retrieve goals');
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.goalService.findOne(req.user.id, id);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Goal retrieved successfully');
    }, 'Failed to retrieve goal');
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateGoalDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.goalService.update(req.user.id, id, dto);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Goal updated successfully');
    }, 'Failed to update goal');
  }

  @Patch(':id/add-funds')
  async addFunds(@Req() req: any, @Param('id') id: string, @Body() dto: AddFundsDto, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.goalService.addFunds(req.user.id, id, dto);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Funds added to goal successfully!');
    }, 'Failed to add funds to goal');
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    await this.handleRequest(async () => {
      await this.goalService.remove(req.user.id, id);
      this.responseService.sendResponse(res, HttpStatus.OK, null, 'Goal deleted successfully');
    }, 'Failed to delete goal');
  }
}
