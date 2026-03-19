import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionFilterDto } from './dto/question-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/public.decorator';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get()
  findAll(@Query() filter: QuestionFilterDto, @Req() req: any) {
    return this.questionsService.findAll(filter, req.user?.id);
  }

  @Get('exams')
  getExams() {
    return this.questionsService.getDistinctExams();
  }

  @Get('tags/popular')
  getPopularTags(@Query('limit') limit = 20) {
    return this.questionsService.getPopularTags(+limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.questionsService.findOne(id, req.user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@CurrentUser() user: any, @Body() dto: CreateQuestionDto) {
    return this.questionsService.create(user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.questionsService.remove(id, user.id, user.isAdmin);
  }

  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  toggleBookmark(@Param('id') id: string, @CurrentUser() user: any) {
    return this.questionsService.toggleBookmark(user.id, id);
  }
}
