import { Controller, Post, Get, Body, UseGuards, Req, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { AiChatService } from '../application/services/ai-chat.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ChatMessageDto } from '../dto/chat-message.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('AI Chat Assistant')
@ApiBearerAuth()
@Controller('api/v1/ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController extends BaseController {
  constructor(
    private readonly aiChatService: AiChatService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Post()
  async chat(@Req() req: any, @Res() res: Response, @Body() dto: ChatMessageDto) {
    await this.handleRequest(async () => {
      const data = await this.aiChatService.chat(req.user.id, dto.message, dto.history);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'AI response generated');
    }, 'Failed to generate AI response');
  }

  @Get('history')
  async getHistory(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.aiChatService.getHistory(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, data.history, 'Chat history retrieved');
    }, 'Failed to get chat history');
  }
}
