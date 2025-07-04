import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetAuthCookieInterceptor } from './interceptors/set-auth-cookie.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //Endpoint para iniciar sesión
  @Post('login')
  @UseInterceptors(SetAuthCookieInterceptor)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}
