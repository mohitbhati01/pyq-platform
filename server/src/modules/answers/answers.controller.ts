import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/public.decorator';

@ApiTags('Answers')
@Controller()
export class AnswersController {
  constructor(private answersService: AnswersService) {}

  @Get('questions/:questionId/answers')
  findByQuestion(@Param('questionId') questionId: string, @Req() req: any) {
    return this.answersService.findByQuestion(questionId, req.user?.id);
  }

  @Post('questions/:questionId/answers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Param('questionId') questionId: string, @CurrentUser() user: any, @Body() dto: CreateAnswerDto) {
    return this.answersService.create(questionId, user.id, dto);
  }

  @Put('answers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreateAnswerDto) {
    return this.answersService.update(id, user.id, dto);
  }

  @Delete('answers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.answersService.remove(id, user.id, user.isAdmin);
  }

  @Post('answers/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  accept(@Param('id') id: string, @CurrentUser() user: any) {
    return this.answersService.acceptAnswer(id, user.id);
  }
}
