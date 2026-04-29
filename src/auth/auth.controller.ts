import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Créer un compte' })
  @Post('/signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @ApiOperation({ summary: 'Se connecter' })
  @Post('/signin')
  async signin(@Body() dto: AuthDto) {
    return await this.authService.signin(dto);
  }

  @ApiOperation({ summary: 'Se déconnecter' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('/logout')
  async logout(@Req() req) {
    return this.authService.logout(req.user.userId);
  }

  @ApiOperation({ summary: 'Rafraîchir les tokens' })
  @ApiBearerAuth()
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
