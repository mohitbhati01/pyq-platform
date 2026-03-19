import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/public.decorator';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

class CreateReportDto {
  @IsString() @IsNotEmpty() targetId: string;
  @IsEnum(['QUESTION', 'ANSWER', 'COMMENT', 'USER']) targetType: string;
  @IsString() @IsNotEmpty() reason: string;
}

class ResolveReportDto {
  @IsEnum(['RESOLVED', 'DISMISSED']) status: 'RESOLVED' | 'DISMISSED';
  @IsOptional() @IsString() adminNote?: string;
}

@ApiTags('Admin')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Any logged-in user can file a report
  @Post('reports')
  createReport(@CurrentUser() user: any, @Body() dto: CreateReportDto) {
    return this.adminService.createReport(user.id, dto);
  }

  // Admin-only routes
  @Get('admin/stats')
  getDashboard(@CurrentUser() user: any) {
    if (!user.isAdmin) throw new ForbiddenException();
    return this.adminService.getDashboardStats();
  }

  @Get('admin/reports')
  getReports(@CurrentUser() user: any, @Query('status') status?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    if (!user.isAdmin) throw new ForbiddenException();
    return this.adminService.getReports(status, +page, +limit);
  }

  @Patch('admin/reports/:id')
  resolveReport(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ResolveReportDto) {
    if (!user.isAdmin) throw new ForbiddenException();
    return this.adminService.resolveReport(id, dto.status, dto.adminNote);
  }

  @Post('admin/users/:id/ban')
  banUser(@CurrentUser() user: any, @Param('id') id: string) {
    if (!user.isAdmin) throw new ForbiddenException();
    return this.adminService.banUser(id, true);
  }

  @Post('admin/users/:id/unban')
  unbanUser(@CurrentUser() user: any, @Param('id') id: string) {
    if (!user.isAdmin) throw new ForbiddenException();
    return this.adminService.banUser(id, false);
  }

  @Get('admin/users')
  getAllUsers(@CurrentUser() user: any, @Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    if (!user.isAdmin) throw new ForbiddenException();
    return this.adminService.getAllUsers(+page, +limit, search);
  }
}
