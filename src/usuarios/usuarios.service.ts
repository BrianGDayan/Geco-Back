import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
    constructor(private prisma: PrismaService) {}

    async obtenerUsuarios(rol?: 'administrador' | 'encargado') {
        const usuarios = await this.prisma.usuario.findMany({
            where: rol ? { rol } : {}, // Filtra si se proporciona un rol
        });

        if (usuarios.length === 0) {
            throw new NotFoundException(`No hay usuarios con rol ${rol}`);
        }

        return usuarios;
    }
    async obtenerUsuarioPorId(idUsuario: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario: idUsuario },
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
