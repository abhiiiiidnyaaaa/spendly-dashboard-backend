import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IncomeService } from '../application/services/income.service';
import { CreateIncomeDto } from '../dto/create-income.dto';
import { UpdateIncomeDto } from '../dto/update-income.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('incomes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/incomes')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  create(@Req() req, @Body() createIncomeDto: CreateIncomeDto) {
    return this.incomeService.create(req.user.id, createIncomeDto);
  }

  @Get()
  findAll(@Req() req) {
    return this.incomeService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.incomeService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() updateIncomeDto: UpdateIncomeDto) {
    return this.incomeService.update(req.user.id, id, updateIncomeDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.incomeService.remove(req.user.id, id);
  }
}
