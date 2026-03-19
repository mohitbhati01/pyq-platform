import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get comments for a question or answer' })
  findByTarget(
    @Query('targetId') targetId: string,
    @Query('targetType') targetType: 'question' | 'answer',
    @Req() req: any,
  ) {
    // Pass userId so the service can return isLiked per comment
    return this.commentsService.findByTarget(targetId, targetType, req.user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment' })
  create(@CurrentUser() user: any, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.id, dto);
  }

  // M-3 fix: Edit comment endpoint
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit own comment' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateCommentDto) {
    return this.commentsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own comment' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentsService.remove(id, user.id, user.isAdmin);
  }

  // C-1 fix: proper like/unlike toggle
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on a comment' })
  like(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentsService.toggleLike(id, user.id);
  }
}
