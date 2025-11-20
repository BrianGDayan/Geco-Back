import { Body, Controller, Get, Param, Patch, Post, ParseIntPipe, ValidationPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from "../auth/guards/roles.guard";
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/type/auth.types';


@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
    
    constructor(private readonly usuariosService: UsuariosService) {}

    // Endpoint para obtener todos los usuarios
    @Get()
    @Roles(UserRole.ADMIN)
    async getUsuarios() {
        return this.usuariosService.obtenerUsuarios();
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

}
