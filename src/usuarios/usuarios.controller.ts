import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ParseIntPipe, ValidationPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from "src/auth/guards/roles.guard";
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/type/auth.types';


@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
    
    constructor(private readonly usuariosService: UsuariosService) {}

    // Endpoint para obtener todos los usuarios
    @Get()
    @Roles(UserRole.ADMIN)
    async getUsuarios(@Query('rol') rol?: 'administrador' | 'encargado') {
        return this.usuariosService.obtenerUsuarios(rol);
    }

     // Endpoint para obtener un usuario por su id
    @Get(':idUsuario')
    @Roles(UserRole.ADMIN)
    async getUsuarioById(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
        return this.usuariosService.obtenerUsuarioPorId(idUsuario);
    } 

    // Endpoint para crear un usuario nuevo
    @Post()
    @Roles(UserRole.ADMIN)
    async createUsuario(@Body(ValidationPipe) createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.crearUsuario(createUsuarioDto);
    }

    // Endpoint para modificar datos de un usuario
    @Patch(':idUsuario')
    @Roles(UserRole.ADMIN)
    async updateUsuario(@Param('idUsuario', ParseIntPipe) idUsuario: number, @Body(ValidationPipe) updateUsuarioDto: UpdateUsuarioDto) {
        return this.usuariosService.actualizarUsuario(idUsuario, updateUsuarioDto);
    }
}
