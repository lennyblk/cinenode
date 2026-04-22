import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @Post('/signin')
  async signin(@Body() dto: AuthDto) {
    return await this.authService.signin(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/logout')
  async logout(@Req() req) {
    return this.authService.logout(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('/refresh')
  refreshTokens(@Req() req) {
    return this.authService.refreshToken(
      req.user.userId,
      req.user.email,
      req.user.refreshToken,
    );
  }
}
