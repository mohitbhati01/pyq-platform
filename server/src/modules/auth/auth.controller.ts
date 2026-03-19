import { Controller, Post, Body, UseGuards, Get, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Throttle } from '@nestjs/throttler';

class OAuthCodeDto {
  @IsString() code: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private config: ConfigService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Req() req) {
    return this.authService.login(req.user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  googleAuth() {}

  /**
   * C-2 fix: Instead of putting tokens in the redirect URL, we generate a
   * short-lived one-time code and redirect with just that code.
   * The client calls POST /auth/oauth/exchange to trade the code for tokens.
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback — redirects with temporary code' })
  async googleCallback(@Req() req, @Res() res) {
    const result = await this.authService.googleLogin(req.user);
    // Store tokens in DB and return a one-time code
    const code = await this.authService.createOAuthCode(result.user.id);
    const clientUrl = this.config.get('CLIENT_URL');
    // Only the short-lived code goes in the URL — not the actual tokens
    return res.redirect(`${clientUrl}/auth/callback?code=${encodeURIComponent(code)}`);
  }

  /**
   * C-2 fix: Client POSTs the one-time code here to receive real tokens in the response body.
   * Code expires in 2 minutes and is deleted on use.
   */
  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Exchange one-time OAuth code for auth tokens' })
  async exchangeOAuthCode(@Body() dto: OAuthCodeDto) {
    return this.authService.exchangeOAuthCode(dto.code);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }
}
