import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UserPayload } from './type/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt: ${JSON.stringify(loginDto)}`);

    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: loginDto.idUsuario },
    });

    this.logger.log(`Usuario encontrado: ${usuario ? usuario.id_usuario : 'no encontrado'}`);

    if (!usuario || usuario.clave !== loginDto.clave) {
      this.logger.warn('Credenciales inválidas');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: UserPayload = {
      id_usuario: usuario.id_usuario,
      rol: usuario.rol,
    };

    const token = this.jwtService.sign(payload);
    this.logger.log(`JWT generado: ${token}`);

    return {
      id_usuario: usuario.id_usuario,
      rol: usuario.rol,
      access_token: token,
    };
  }
}
