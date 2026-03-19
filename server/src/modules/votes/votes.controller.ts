import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { VotesService } from './votes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/public.decorator';

class VoteDto {
  @IsInt() value: 1 | -1;
}

@ApiTags('Votes')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
// C-4 fix: rate limit votes to 30 per minute per user to prevent flood attacks
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class VotesController {
  constructor(private votesService: VotesService) {}

  @Post('questions/:id/vote')
  @ApiOperation({ summary: 'Vote on a question (+1 upvote / -1 downvote)' })
  voteQuestion(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: VoteDto) {
    return this.votesService.vote(user.id, id, 'QUESTION', dto.value);
  }

  @Post('answers/:id/vote')
  @ApiOperation({ summary: 'Vote on an answer (+1 upvote / -1 downvote)' })
  voteAnswer(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: VoteDto) {
    return this.votesService.vote(user.id, id, 'ANSWER', dto.value);
  }
}
