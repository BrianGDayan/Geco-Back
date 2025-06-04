import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Endpoint para el inicio de sesión
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const { id_usuario, rol, access_token } = await this.authService.login(loginDto);

  // Enviar el token en una cookie HTTP-only
  res.cookie('access_token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: 'localhost',
    maxAge: 2 * 60 * 60 * 1000,  // 2 horas
    path: '/',
  });

    return res.status(HttpStatus.OK).json({ 
      id_usuario,
      rol,
     });
  }
}