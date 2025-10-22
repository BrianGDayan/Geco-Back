import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
    constructor(private prisma: PrismaService) {}

    async obtenerUsuarios() {
        const usuarios = await this.prisma.usuario.findMany({
            select: {
                id_usuario: true,
                rol: true,
            }
        });
        return usuarios;
    }
    
    async obtenerUsuarioPorId(idUsuario: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario: idUsuario },
            select: {
                id_usuario: true,
                rol: true,
            }
        });
        if (!usuario) {
            throw new NotFoundException(`Usuario con id ${idUsuario} no encontrado`);
        }
        return usuario;
    }

    async crearUsuario(createUsuarioDto: CreateUsuarioDto) {
        return await this.prisma.usuario.create({
            data: createUsuarioDto,
        });
    }

    async actualizarUsuario(idUsuario: number, updateUsuarioDto: UpdateUsuarioDto) {
  
        const usuarioExistente = await this.prisma.usuario.findUnique({
        where: { id_usuario: idUsuario },
        });

        if (!usuarioExistente) {
            throw new NotFoundException(`Usuario con id ${idUsuario} no encontrado`);
        }

        return await this.prisma.usuario.update({
            where: { id_usuario: idUsuario },
            data: updateUsuarioDto,
        });
    }
}
