import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

class SuggestTagsDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
}

class SuggestAnswerDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
}

class ImproveAnswerDto {
  @IsString() @IsNotEmpty() answerBody: string;
  @IsString() @IsNotEmpty() context: string;
}

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('suggest-tags')
  suggestTags(@Body() dto: SuggestTagsDto) {
    return this.aiService.suggestTags(dto.title, dto.description);
  }

  @Post('suggest-answer')
  suggestAnswer(@Body() dto: SuggestAnswerDto) {
    return this.aiService.suggestAnswer(dto.title, dto.description);
  }

  @Post('improve-answer')
  improveAnswer(@Body() dto: ImproveAnswerDto) {
    return this.aiService.improveAnswer(dto.answerBody, dto.context);
  }
}
