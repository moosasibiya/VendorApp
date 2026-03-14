import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type {
  ApiResponse,
  ConversationMessage,
  ConversationSummary,
  CursorApiResponse,
} from '@vendorapp/shared';
import { AuthGuard } from '../auth/auth.guard';
import { ConversationIdParamDto } from './dto/conversation-id-param.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ListConversationMessagesQueryDto } from './dto/list-conversation-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

type AuthenticatedRequest = {
  auth?: {
    userId: string;
  };
};

@Controller('conversations')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async createConversation(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateConversationDto,
  ): Promise<ApiResponse<ConversationSummary>> {
    return this.messagesService.createConversation(this.getUserId(request), input);
  }

  @Get()
  async listConversations(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponse<ConversationSummary[]>> {
    return this.messagesService.listConversations(this.getUserId(request));
  }

  @Get(':id/messages')
  async listMessages(
    @Req() request: AuthenticatedRequest,
    @Param() params: ConversationIdParamDto,
    @Query() query: ListConversationMessagesQueryDto,
  ): Promise<CursorApiResponse<ConversationMessage[]>> {
    return this.messagesService.listMessages(this.getUserId(request), params.id, query);
  }

  @Post(':id/messages')
  async sendMessage(
    @Req() request: AuthenticatedRequest,
    @Param() params: ConversationIdParamDto,
    @Body() input: SendMessageDto,
  ): Promise<ApiResponse<ConversationMessage>> {
    return this.messagesService.sendMessage(this.getUserId(request), params.id, input);
  }

  @Patch(':id/read')
  async markRead(
    @Req() request: AuthenticatedRequest,
    @Param() params: ConversationIdParamDto,
  ): Promise<{ success: true }> {
    return this.messagesService.markConversationRead(this.getUserId(request), params.id);
  }

  private getUserId(request: AuthenticatedRequest): string {
    const userId = request.auth?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user context missing');
    }
    return userId;
  }
}
