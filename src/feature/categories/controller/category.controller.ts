import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CategoryService } from '../application/services/category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController extends BaseController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Post()
  async create(
    @Body() dto: CreateCategoryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const category = await this.categoryService.create(userId, dto);
      this.responseService.sendResponse(
        res,
        HttpStatus.CREATED,
        category,
        'Category created successfully',
      );
    }, 'Error occurred while creating category');
  }

  @Get()
  async findAll(@Req() req: Request, @Res() res: Response) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const categories = await this.categoryService.findAll(userId);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        categories,
        'Categories retrieved successfully',
      );
    }, 'Error occurred while fetching categories');
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const category = await this.categoryService.update(id, userId, dto);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        category,
        'Category updated successfully',
      );
    }, 'Error occurred while updating category');
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      await this.categoryService.delete(id, userId);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        null,
        'Category deleted successfully',
      );
    }, 'Error occurred while deleting category');
  }
}
