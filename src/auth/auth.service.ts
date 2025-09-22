import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UserPayload } from './type/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    console.log('Login attempt:', loginDto);

    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: loginDto.idUsuario },
    });
    console.log('Usuario encontrado:', usuario);

    if (!usuario || usuario.clave !== loginDto.clave) {
      console.log('Credenciales inválidas');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: UserPayload = { 
      id_usuario: usuario.id_usuario,
      rol: usuario.rol 
    };
    const token = this.jwtService.sign(payload);
    console.log('JWT generado:', token);

    // 🔑 ahora devolvemos el token directamente en el body
    return {
      id_usuario: usuario.id_usuario,
      rol: usuario.rol,
      access_token: token,
    };
  }
}
