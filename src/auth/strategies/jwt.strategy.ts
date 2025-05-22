import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPayload } from '../type/auth.types';

const cookieExtractor = (req: Request): string | null => {
  return req.cookies['access_token'] || null;
};
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey', // Usa variables de entorno
    });
  }

  // jwt.strategy.ts
  async validate(payload: UserPayload) {
    const user = await this.prisma.usuario.findUnique({
      where: { id_usuario: payload.id_usuario },
      select: { id_usuario: true, rol: true }
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }
}