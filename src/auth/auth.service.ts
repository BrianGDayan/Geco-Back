import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UserPayload } from './type/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // 1. Buscar usuario por id_usuario
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: loginDto.id_usuario },
    });

    // 2. Verificar si existe y coincide la clave
    if (!usuario || !(await bcrypt.compare(loginDto.clave, usuario.clave))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Generar JWT
    const payload: UserPayload = { 
      id_usuario: usuario.id_usuario,
      rol: usuario.rol 
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}