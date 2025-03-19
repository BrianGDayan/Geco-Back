import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
    constructor(private prisma: PrismaService) {}

    async getUsuarios(rol?: 'administrador' | 'encargado') {
        const usuarios = await this.prisma.usuario.findMany({
            where: rol ? { rol } : {}, // Filtra si se proporciona un rol
        });

        if (usuarios.length === 0) {
            throw new NotFoundException(`No hay usuarios con rol ${rol}`);
        }

        return usuarios;
    }
    async getUsuarioById(id: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario: id },
        });
        if (!usuario) {
            throw new NotFoundException(`Usuario con id ${id} no encontrado`);
        }
        return usuario;
    }

    async createUsuario(createUsuarioDto: CreateUsuarioDto) {
        return await this.prisma.usuario.create({
            data: createUsuarioDto,
        });
    }

    async updateUsuario(id: number, updateUsuarioDto: UpdateUsuarioDto) {
  
        const usuarioExistente = await this.prisma.usuario.findUnique({
        where: { id_usuario: id },
        });

        if (!usuarioExistente) {
            throw new NotFoundException(`Usuario con id ${id} no encontrado`);
        }

        return await this.prisma.usuario.update({
        where: { id_usuario: id },
        data: updateUsuarioDto,
        });
    }

    async deleteUsuario(id: number) {
        const usuarioExistente = await this.prisma.usuario.findUnique({
            where: { id_usuario: id },
        })
        if (!usuarioExistente) {
            throw new NotFoundException(`Usuario con id ${id} no encontrado`);
        }
        return await this.prisma.usuario.delete({
            where: {id_usuario: id},
        });
    }
}
