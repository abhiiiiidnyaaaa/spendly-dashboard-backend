/**
 * UserController
 *
 * REST API endpoints for user profile management.
 * Routes: /users
 *
 * KEY NOTES:
 * - All endpoints require JWT authentication
 * - Extends BaseController for standardized error handling
 * - Uses ResponseService for consistent response format
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from '../application/services/user.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController extends BaseController {
  constructor(
    private readonly userService: UserService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  // ========== Read ==========

  @Get('profile')
  async getProfile(@Req() req: Request, @Res() res: Response) {
    await this.handleRequest(async () => {
      const userId = (req as any).user?.id;
      const user = await this.userService.findById(userId);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        user,
        'Profile retrieved successfully',
      );
    }, 'Error occurred while fetching profile');
  }

  // ========== Upload Avatar ==========
  @Post('profile/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      if (!file) {
        throw new BadRequestException('File is missing');
      }

      const userId = (req as any).user?.id;
      const port = process.env.PORT ?? 4000;
      const avatarUrl = `http://localhost:${port}/uploads/avatars/${file.filename}`;
      
      const user = await this.userService.update(userId, { avatar: avatarUrl });

      this.responseService.sendResponse(res, HttpStatus.OK, user, 'Avatar uploaded successfully');
    }, 'Error occurred while uploading avatar');
  }

  // ========== Update ==========

  @Put('profile')
  async updateProfile(
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user?.id;
      const user = await this.userService.update(userId, dto);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        user,
        'Profile updated successfully',
      );
    }, 'Error occurred while updating profile');
  }
}
