import { Controller, Post, Body, Req } from '@nestjs/common';
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

  @Post('/logout')
  async logout(@Body() userId: string) {
    return this.authService.logout(userId);
  }

  @Post('/refresh')
  refreshTokens(@Req() req) {
    return this.authService.refreshToken(
      req.user.userId,
      req.user.email,
      req.user.refreshToken,
    );
  }
}
