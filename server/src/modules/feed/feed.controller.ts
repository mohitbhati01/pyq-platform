import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/public.decorator';

@ApiTags('Feed')
@Controller('feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  getFeed(@CurrentUser() user: any, @Query('page') page = 1, @Query('limit') limit = 15) {
    return this.feedService.getUserFeed(user.id, +page, +limit);
  }

  @Get('trending')
  getTrending(@Query('page') page = 1, @Query('limit') limit = 15) {
    return this.feedService.getTrending(+page, +limit);
  }
}
