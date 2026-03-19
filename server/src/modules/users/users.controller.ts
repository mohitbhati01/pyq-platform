import { Controller, Get, Put, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit = 20) {
    return this.usersService.getLeaderboard(+limit);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMe(@CurrentUser() user: any) {
    const { passwordHash, googleId, ...safe } = user;
    return safe;
  }

  @Get(':username')
  getProfile(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  toggleFollow(@CurrentUser() user: any, @Param('id') targetId: string) {
    return this.usersService.followUser(user.id, targetId);
  }

  @Get(':id/followers')
  getFollowers(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.getFollowers(id, +page, +limit);
  }

  @Get(':id/following')
  getFollowing(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.getFollowing(id, +page, +limit);
  }

  @Get(':id/questions')
  getUserQuestions(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.usersService.getUserQuestions(id, +page, +limit);
  }

  @Get('me/bookmarks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getBookmarks(@CurrentUser() user: any, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.usersService.getBookmarks(user.id, +page, +limit);
  }
}
